import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateVendorMetrics } from "@/lib/verification-automation";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";

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
      .select("role")
      .eq("id", user.id)
      .single();

    // Vendor can accept/reject their own bookings
    if (profile?.role === "vendor") {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (notes) updates.notes = notes;
      if (status === "accepted") updates.confirmed_at = new Date().toISOString();

      const { data: booking, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .eq("vendor_id", vendor.id)
        .select("*, event:events(title), customer:profiles(email, full_name)")
        .single();

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
      }

      // Refresh metrics when a booking is completed or cancelled
      if (status === "completed" || status === "cancelled") {
        void updateVendorMetrics(vendor.id, supabase);
      }

      const event = booking.event as Record<string, string>;
      const customer = booking.customer as Record<string, string>;

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
        .select()
        .single();

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

      return NextResponse.json(booking);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
