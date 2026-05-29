import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
    if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

    const { data: sub } = await supabase
      .from("vendor_subscriptions")
      .select("stripe_customer_id")
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "No active Stripe customer" }, { status: 400 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Portal session error:", err);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
