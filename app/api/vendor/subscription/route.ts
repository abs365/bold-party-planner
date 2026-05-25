import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLAN_PRICES: Record<string, { monthly: string; name: string; price: number }> = {
  pro: { monthly: process.env.STRIPE_PRO_PRICE_ID ?? "", name: "Pro", price: 29 },
  featured: { monthly: process.env.STRIPE_FEATURED_PRICE_ID ?? "", name: "Featured", price: 79 },
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data: subscription } = await supabase
    .from("vendor_subscriptions")
    .select("*")
    .eq("vendor_id", vendor.id)
    .single();

  return NextResponse.json(subscription ?? { plan: "free", status: "active" });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { plan } = await req.json() as { plan: string };

  if (plan === "free") {
    await supabase.from("vendor_subscriptions").upsert({ vendor_id: vendor.id, plan: "free", status: "active" }, { onConflict: "vendor_id" });
    await supabase.from("vendors").update({ subscription_plan: "free", featured: false }).eq("id", vendor.id);
    return NextResponse.json({ success: true, plan: "free" });
  }

  const planConfig = PLAN_PRICES[plan];
  if (!planConfig) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  if (!planConfig.monthly) return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });

  const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).single();

  const stripe = (await import("stripe")).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as never });

  const { data: existingSub } = await supabase.from("vendor_subscriptions").select("stripe_customer_id").eq("vendor_id", vendor.id).single();
  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email: profile?.email ?? user.email,
      name: profile?.full_name ?? undefined,
      metadata: { vendor_id: vendor.id, user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.monthly, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/subscription?cancelled=true`,
    metadata: { vendor_id: vendor.id, plan },
  });

  return NextResponse.json({ checkout_url: session.url });
}
