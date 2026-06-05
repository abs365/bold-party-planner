import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { assertStripeKey, assertWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: import("stripe").Stripe.Event;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(assertStripeKey());
    event = stripe.webhooks.constructEvent(body, sig, assertWebhookSecret());
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
    .maybeSingle();

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
      .maybeSingle();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate ownership — prevents metadata tampering from associating payment with wrong booking
    if (customerId && booking.customer_id !== customerId) {
      console.error("Webhook: customer_id mismatch", { bookingId, meta: customerId, db: booking.customer_id });
      return NextResponse.json({ error: "Ownership validation failed" }, { status: 400 });
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
      .maybeSingle();

    const { data: vendorProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", vendor?.user_id)
      .maybeSingle();

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

    const { data: payment } = await supabase
      .from("payments")
      .select("booking_id")
      .eq("stripe_payment_intent_id", charge.payment_intent as string)
      .maybeSingle();

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

  // ── Handle customer.subscription.created / updated ────────────────────────
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as import("stripe").Stripe.Subscription;
    const meta = sub.metadata ?? {};
    const vendorId = meta.vendor_id;
    const planSlug = meta.plan as string;

    if (vendorId && planSlug) {
      const isFeatured = planSlug === "premium" || planSlug === "elite" || planSlug === "featured";
      const isActive   = sub.status === "active" || sub.status === "trialing";

      await supabase.from("vendor_subscriptions").upsert({
        vendor_id:            vendorId,
        plan:                 planSlug,
        status:               sub.status,
        stripe_subscription_id: sub.id,
        stripe_customer_id:   sub.customer as string,
        current_period_start: new Date(((sub as unknown as Record<string, number>).current_period_start ?? 0) * 1000).toISOString(),
        current_period_end:   new Date(((sub as unknown as Record<string, number>).current_period_end   ?? 0) * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        last_payment_at:      isActive ? new Date().toISOString() : undefined,
      }, { onConflict: "vendor_id" });

      // Sync subscription_plan + featured flag on the vendor row
      await supabase.from("vendors").update({
        subscription_plan: planSlug,
        featured: isFeatured && isActive,
      }).eq("id", vendorId);

      // Billing event
      await supabase.from("subscription_billing_events").insert({
        vendor_id:   vendorId,
        stripe_event_id: event.id,
        event_type:  event.type === "customer.subscription.created" ? "subscription_started" : "subscription_updated",
        plan_slug:   planSlug,
      });
    }
  }

  // ── Handle customer.subscription.deleted ──────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as import("stripe").Stripe.Subscription;
    const meta = sub.metadata ?? {};
    const vendorId = meta.vendor_id;

    if (vendorId) {
      await supabase.from("vendor_subscriptions").update({
        plan: "free", status: "cancelled",
        cancel_at_period_end: false,
      }).eq("vendor_id", vendorId);

      await supabase.from("vendors").update({
        subscription_plan: "free", featured: false,
      }).eq("id", vendorId);

      await supabase.from("subscription_billing_events").insert({
        vendor_id: vendorId, stripe_event_id: event.id,
        event_type: "subscription_cancelled", plan_slug: "free",
      });

      // Notify vendor
      const { data: vendor } = await supabase.from("vendors").select("user_id, business_name").eq("id", vendorId).maybeSingle();
      if (vendor?.user_id) {
        void supabase.rpc("notify_user", {
          p_user_id: vendor.user_id,
          p_title: "Subscription Cancelled",
          p_message: "Your paid subscription has ended. Your listing has moved to the Free plan.",
          p_type: "system",
          p_link: "/vendor/subscription",
        });
      }
    }
  }

  // ── Handle invoice.paid (subscription renewal) ────────────────────────────
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as unknown as { subscription?: string; amount_paid?: number; id: string };
    if (invoice.subscription) {
      const { data: sub } = await supabase
        .from("vendor_subscriptions")
        .select("id, vendor_id, plan")
        .eq("stripe_subscription_id", invoice.subscription)
        .maybeSingle();

      if (sub) {
        await supabase.from("vendor_subscriptions").update({
          status: "active",
          failed_payment_count: 0,
          last_payment_at: new Date().toISOString(),
        }).eq("id", sub.id);

        // Restore featured flag for plans that are featured-eligible.
        // This reinstates featured placement removed during invoice.payment_failed.
        const featuredEligiblePlans = ["featured", "premium", "elite"];
        const shouldBeFeatured = featuredEligiblePlans.includes(sub.plan ?? "");
        await supabase.from("vendors").update({ featured: shouldBeFeatured }).eq("id", sub.vendor_id);

        await supabase.from("subscription_billing_events").insert({
          vendor_id: sub.vendor_id,
          vendor_subscription_id: sub.id,
          stripe_event_id: event.id,
          event_type: "payment_succeeded",
          plan_slug:  sub.plan,
          amount_gbp: (invoice.amount_paid ?? 0) / 100,
          stripe_invoice_id: invoice.id,
        });
      }
    }
  }

  // ── Handle invoice.payment_failed ─────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as unknown as { subscription?: string; amount_due?: number; id: string; last_finalization_error?: Record<string, string> | null };
    if (invoice.subscription) {
      const { data: sub } = await supabase
        .from("vendor_subscriptions")
        .select("id, vendor_id, plan, failed_payment_count")
        .eq("stripe_subscription_id", invoice.subscription)
        .maybeSingle();

      if (sub) {
        const failCount = (sub.failed_payment_count ?? 0) + 1;
        await supabase.from("vendor_subscriptions").update({
          status: "past_due",
          failed_payment_count: failCount,
        }).eq("id", sub.id);

        // Remove featured placement immediately — featured slot has monetary value and
        // must not be held by a non-paying vendor during the Stripe retry window (up to 14 days).
        // Restored automatically when invoice.paid fires.
        await supabase.from("vendors").update({ featured: false }).eq("id", sub.vendor_id);

        await supabase.from("subscription_billing_events").insert({
          vendor_id: sub.vendor_id,
          vendor_subscription_id: sub.id,
          stripe_event_id: event.id,
          event_type: "payment_failed",
          plan_slug:  sub.plan,
          amount_gbp: (invoice.amount_due ?? 0) / 100,
          stripe_invoice_id: invoice.id,
          failure_reason: (invoice.last_finalization_error as Record<string, string> | null)?.message ?? "Payment failed",
        });

        // Notify vendor in-app + email
        const { data: vendor } = await supabase
          .from("vendors")
          .select("user_id, business_name")
          .eq("id", sub.vendor_id)
          .maybeSingle();

        if (vendor?.user_id) {
          void supabase.rpc("notify_user", {
            p_user_id: vendor.user_id,
            p_title: "Payment Failed — Action Required",
            p_message: "Your subscription payment failed. Please update your payment method to restore your features.",
            p_type: "system",
            p_link: "/vendor/subscription",
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", vendor.user_id)
            .maybeSingle();

          if (profile?.email) {
            const { sendSubscriptionPaymentFailed } = await import("@/lib/resend");
            void sendSubscriptionPaymentFailed(
              profile.email,
              profile.full_name ?? vendor.business_name ?? "Vendor",
              sub.plan,
              failCount
            );
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
