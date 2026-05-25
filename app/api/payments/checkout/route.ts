import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      .single();

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!["accepted", "confirmed"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking must be accepted before payment" }, { status: 400 });
    }

    const amount = paymentType === "deposit" ? booking.deposit_amount : booking.total_amount;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const event = booking.event as Record<string, string>;
    const vendor = booking.vendor as Record<string, string>;

    // Lazily import Stripe to avoid module-level instantiation
    const Stripe = (await import("stripe")).default;
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${appUrl}/payment/cancel?booking_id=${bookingId}`,
      customer_email: user.email,
    });

    // Record the checkout session on the booking
    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", bookingId);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
