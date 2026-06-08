import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateVendorMetrics } from "@/lib/verification-automation";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";
import type { SupabaseClient } from "@supabase/supabase-js";

interface RefundableBooking {
  id: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
}

async function issueRefundForCancellation(
  supabase: SupabaseClient,
  booking: RefundableBooking,
  actorUserId: string,
  actorRole: "customer" | "vendor" | "admin",
  customerEmail: string,
  customerName: string,
  eventTitle: string,
  ipAddress: string
): Promise<void> {
  if (!["deposit_paid", "fully_paid"].includes(booking.payment_status)) return;

  const { data: payment } = await supabase
    .from("payments")
    .select("stripe_payment_intent_id, amount")
    .eq("booking_id", booking.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.stripe_payment_intent_id) {
    console.warn("[refund] No succeeded payment found for booking", booking.id);
    return;
  }

  const refundAmount =
    booking.payment_status === "deposit_paid"
      ? Number(booking.deposit_amount)
      : Number(booking.total_amount);

  try {
    const { createRefund } = await import("@/lib/stripe/index");
    await createRefund(payment.stripe_payment_intent_id, refundAmount);
  } catch (err) {
    console.error("[refund] Stripe refund failed for booking", booking.id, err);
    return;
  }

  // Stripe refund succeeded — now execute all secondary actions.
  // Each is independently try/caught: failure logs and records a partial_failure audit
  // entry but never rolls back the Stripe refund already issued.
  const failures: string[] = [];

  // 1. Booking payment_status
  const { error: bookingUpdateErr } = await supabase
    .from("bookings")
    .update({ payment_status: "refunded" })
    .eq("id", booking.id);
  if (bookingUpdateErr) {
    console.error("[refund] booking payment_status update failed", booking.id, bookingUpdateErr.message);
    failures.push("booking_status");
  }

  // 2. Ledger — helpers have internal try/catch
  const { updateLedgerPaymentStatus, appendLedgerEvent } = await import("@/lib/finance/ledger");
  const ledgerId = await updateLedgerPaymentStatus(
    supabase,
    payment.stripe_payment_intent_id,
    "refunded",
    { refundAmount }
  );
  await appendLedgerEvent(
    supabase,
    "REFUND_COMPLETED",
    {
      booking_id: booking.id,
      refund_amount: refundAmount,
      cancelled_by: actorRole,
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
    },
    ledgerId
  );

  // 3. Audit log — has internal try/catch
  await createAuditLog({
    actorUserId,
    actorRole,
    action: "booking.refund.issued",
    entityType: "booking",
    entityId: booking.id,
    after: { refund_amount: refundAmount, payment_status: "refunded" },
    ipAddress,
  });

  // 4. Customer and admin emails — best effort
  const { sendRefundProcessed, sendAdminRefundAlert } = await import("@/lib/resend");
  try {
    await sendRefundProcessed(customerEmail, customerName, refundAmount, eventTitle);
  } catch (err) {
    console.error("[refund] Customer refund email failed", booking.id, err);
    failures.push("customer_email");
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  try {
    await sendAdminRefundAlert(adminEmails, booking.id, refundAmount, eventTitle, customerEmail, actorRole);
  } catch (err) {
    console.error("[refund] Admin refund alert email failed", booking.id, err);
    failures.push("admin_email");
  }

  // If any secondary step failed, write a partial_failure audit entry so
  // the admin finance dashboard can surface it.
  if (failures.length > 0) {
    await createAuditLog({
      actorUserId,
      actorRole: "system",
      action: "booking.refund.partial_failure",
      entityType: "booking",
      entityId: booking.id,
      after: {
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        refund_amount: refundAmount,
        failed_steps: failures,
      },
      ipAddress,
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status, notes } = await request.json() as {
      status?: string;
      notes?: string;
    };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    // Vendor can accept/reject/cancel their own bookings
    if (profile?.role === "vendor") {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (notes) updates.notes = notes;
      if (status === "accepted") updates.confirmed_at = new Date().toISOString();
      if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

      const { data: booking, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .eq("vendor_id", vendor.id)
        .select("*, event:events(title), customer:profiles(email, full_name)")
        .maybeSingle();

      if (error || !booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

      void createAuditLog({
        actorUserId: user.id,
        actorRole: "vendor",
        action: "booking.status.change",
        entityType: "booking",
        entityId: id,
        after: { status },
        ipAddress: ipFromRequest(request),
      });
      if (status === "accepted") {
        void track({ event: "booking.confirmed", userId: user.id, properties: { booking_id: id } });
      } else if (status === "completed") {
        void track({ event: "booking.completed", userId: user.id, properties: { booking_id: id } });
      } else if (status === "cancelled") {
        void track({ event: "booking.cancelled", userId: user.id, properties: { booking_id: id } });
      }

      // Refresh metrics when a booking is completed or cancelled
      if (status === "completed" || status === "cancelled") {
        void updateVendorMetrics(vendor.id, supabase);
      }

      const event = booking.event as Record<string, string>;
      const customer = booking.customer as Record<string, string>;

      // Automatic refund when vendor cancels a paid booking
      if (status === "cancelled") {
        await issueRefundForCancellation(
          supabase as unknown as SupabaseClient,
          booking as unknown as RefundableBooking,
          user.id,
          "vendor",
          customer?.email ?? "",
          customer?.full_name ?? "Customer",
          event?.title ?? "your event",
          ipFromRequest(request)
        );
      }

      // Email notification
      if (status === "accepted" && customer?.email) {
        const { sendBookingAccepted } = await import("@/lib/resend");
        void sendBookingAccepted(
          customer.email,
          customer.full_name ?? "Customer",
          vendor.id,
          event?.title ?? "your event",
          id
        );
      } else if (status === "rejected" && customer?.email) {
        const { sendBookingRejected } = await import("@/lib/resend");
        void sendBookingRejected(
          customer.email,
          customer.full_name ?? "Customer",
          vendor.id,
          event?.title ?? "your event"
        );
      }

      // Notify customer
      void supabase.rpc("notify_user", {
        p_user_id: booking.customer_id,
        p_title: status === "accepted" ? "Booking Accepted! 🎉" : "Booking Update",
        p_message: status === "accepted"
          ? `Your booking for ${event?.title ?? "your event"} has been accepted. Pay deposit to confirm.`
          : `Your booking request was declined.`,
        p_type: "booking",
        p_link: `/dashboard/bookings/${id}`,
      });

      return NextResponse.json(booking);
    }

    // Customer can cancel their own bookings
    if (profile?.role === "customer" && status === "cancelled") {
      const { data: booking, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", id)
        .eq("customer_id", user.id)
        .select("*, event:events(title)")
        .maybeSingle();

      if (error || !booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

      void createAuditLog({
        actorUserId: user.id,
        actorRole: "customer",
        action: "booking.cancelled",
        entityType: "booking",
        entityId: id,
        ipAddress: ipFromRequest(request),
      });
      void track({ event: "booking.cancelled", userId: user.id, properties: { booking_id: id } });

      // Automatic refund when customer cancels a paid booking
      const eventData = booking.event as Record<string, string>;
      await issueRefundForCancellation(
        supabase as unknown as SupabaseClient,
        booking as unknown as RefundableBooking,
        user.id,
        "customer",
        user.email ?? "",
        (profile as { role: string; full_name?: string } | null)?.full_name ?? "Customer",
        eventData?.title ?? "your event",
        ipFromRequest(request)
      );

      return NextResponse.json(booking);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
