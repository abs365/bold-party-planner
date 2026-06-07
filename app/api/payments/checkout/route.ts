import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { assertStripeKey } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await rateLimit({ identifier: `checkout:hr:${user.id}`, limit: 10, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      );
    }

    const { bookingId, paymentType } = await request.json() as {
      bookingId: string;
      paymentType: "deposit" | "full";
    };

    if (!bookingId || !paymentType) {
      return NextResponse.json({ error: "Missing bookingId or paymentType" }, { status: 400 });
    }

    // Fetch booking with event and vendor
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, event:events(title, date), vendor:vendors(business_name, user_id)")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!["accepted", "confirmed", "pending_payment"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking must be accepted before payment" }, { status: 400 });
    }

    const amount = paymentType === "deposit" ? booking.deposit_amount : booking.total_amount;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("Checkout error: NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json(
        { error: "Server misconfiguration: NEXT_PUBLIC_APP_URL is not set" },
        { status: 500 }
      );
    }

    const event = booking.event as Record<string, string>;
    const vendor = booking.vendor as Record<string, string>;

    // Lazily import Stripe to avoid module-level instantiation
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(assertStripeKey());

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${vendor.business_name} — ${event.title}`,
              description: paymentType === "deposit"
                ? `30% deposit payment (event: ${event.title})`
                : `Full payment (event: ${event.title})`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        customer_id: user.id,
        payment_type: paymentType,
        amount: String(amount),
        vendor_payout: String(paymentType === "deposit"
          ? booking.deposit_amount * 0.9
          : booking.vendor_payout),
      },
      // Propagate booking context to the PaymentIntent so payment_intent.payment_failed
      // webhook can identify the booking and notify the customer.
      payment_intent_data: {
        metadata: {
          booking_id: bookingId,
          customer_id: user.id,
          payment_type: paymentType,
          amount: String(amount),
        },
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${appUrl}/payment/cancel?booking_id=${bookingId}`,
      customer_email: user.email,
    });

    // Record the checkout session on the booking
    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", bookingId);

    return NextResponse.json({ url: session.url, sessionId: session.id }, {
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
      },
    });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
