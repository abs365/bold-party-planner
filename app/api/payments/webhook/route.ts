import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  let event: import("stripe").Stripe.Event;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // ── Idempotency check ─────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Mark event as processed
  await supabase.from("stripe_events").insert({ id: event.id, type: event.type });

  // ── Handle checkout.session.completed ────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    const bookingId = meta.booking_id;
    const customerId = meta.customer_id;
    const paymentType = meta.payment_type as "deposit" | "full";
    const amount = Number(meta.amount ?? 0);

    if (!bookingId || !customerId) {
      console.error("Webhook: missing metadata", meta);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Fetch the booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, vendor:vendors(user_id, business_name), event:events(title)")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const newPaymentStatus = paymentType === "deposit" ? "deposit_paid" : "fully_paid";
    const newBookingStatus = booking.status === "accepted" ? "confirmed" : booking.status;

    // Update booking
    await supabase.from("bookings").update({
      payment_status: newPaymentStatus,
      status: newBookingStatus,
    }).eq("id", bookingId);

    // Create payment record
    await supabase.from("payments").insert({
      booking_id: bookingId,
      stripe_payment_intent_id: session.payment_intent as string ?? null,
      stripe_checkout_session_id: session.id,
      amount,
      type: paymentType,
      status: "succeeded",
      currency: session.currency ?? "gbp",
      description: `${paymentType === "deposit" ? "Deposit" : "Full"} payment for booking`,
    });

    // Update invoice status
    await supabase.from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("booking_id", bookingId);

    // Notifications
    const vendor = booking.vendor as Record<string, string>;
    const eventData = booking.event as Record<string, string>;

    await supabase.rpc("notify_user", {
      p_user_id: customerId,
      p_title: "Payment Confirmed ✅",
      p_message: `Your ${paymentType} payment of £${amount.toFixed(2)} for ${eventData.title ?? "your event"} was successful.`,
      p_type: "payment",
      p_link: `/dashboard/bookings/${bookingId}`,
    });

    if (vendor?.user_id) {
      await supabase.rpc("notify_user", {
        p_user_id: vendor.user_id,
        p_title: "Payment Received",
        p_message: `A payment of £${amount.toFixed(2)} was received for ${eventData.title ?? "a booking"}.`,
        p_type: "payment",
        p_link: `/vendor/bookings/${bookingId}`,
      });
    }

    // Email notifications (fire-and-forget)
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", customerId)
      .single();

    const { data: vendorProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", vendor?.user_id)
      .single();

    if (customerProfile?.email) {
      const { sendPaymentReceived } = await import("@/lib/resend");
      void sendPaymentReceived(
        customerProfile.email,
        customerProfile.full_name ?? "Customer",
        amount,
        eventData.title ?? "your event",
        paymentType,
        bookingId
      );
    }

    if (vendorProfile?.email) {
      const { sendVendorPaymentNotification } = await import("@/lib/resend");
      void sendVendorPaymentNotification(
        vendorProfile.email,
        vendorProfile.full_name ?? "Vendor",
        amount,
        eventData.title ?? "an event",
        bookingId
      );
    }
  }

  // ── Handle payment_intent.payment_failed ──────────────────────────────────
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", intent.id);
  }

  // ── Handle charge.refunded ────────────────────────────────────────────────
  if (event.type === "charge.refunded") {
    const charge = event.data.object as import("stripe").Stripe.Charge;
    const refundAmount = (charge.amount_refunded ?? 0) / 100;

    // Look up booking via payment intent
    const { data: payment } = await supabase
      .from("payments")
      .select("booking_id")
      .eq("stripe_payment_intent_id", charge.payment_intent as string)
      .single();

    if (payment) {
      await supabase.from("bookings")
        .update({ payment_status: "refunded" })
        .eq("id", payment.booking_id);

      await supabase.from("payments").insert({
        booking_id: payment.booking_id,
        stripe_charge_id: charge.id,
        amount: refundAmount,
        type: "refund",
        status: "succeeded",
        currency: charge.currency,
        description: "Stripe refund",
      });
    }
  }

  return NextResponse.json({ received: true });
}
