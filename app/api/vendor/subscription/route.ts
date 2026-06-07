import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

// Stripe price IDs per plan per billing cycle — configure in .env
const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  pro:     { monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID     ?? process.env.STRIPE_PRO_PRICE_ID     ?? "", annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID     ?? "" },
  premium: { monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? process.env.STRIPE_FEATURED_PRICE_ID ?? "", annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID ?? "" },
  featured:{ monthly: process.env.STRIPE_FEATURED_PRICE_ID        ?? "", annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID ?? "" }, // legacy alias
  elite:   { monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID   ?? "", annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID   ?? "" },
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id, subscription_plan").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data: subscription } = await supabase
    .from("vendor_subscriptions")
    .select("*")
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  // Also return available plans from DB
  const db = await createAdminClient();
  const { data: plans } = await db
    .from("subscription_plans")
    .select("slug, name, monthly_price, annual_price, visibility_boost, max_images, max_packages, analytics_tier, featured_eligible, category_featured_eligible, priority_support, features_json, sort_order")
    .eq("active", true)
    .order("sort_order");

  return NextResponse.json({
    subscription: subscription ?? { plan: "free", status: "active" },
    plans: plans ?? [],
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimit({ ...RATE_LIMITS.payment, identifier: `sub:${ip}` });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id, subscription_plan, status").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  if (vendor.status === "suspended") {
    return NextResponse.json({ error: "Suspended vendors cannot change subscription" }, { status: 403 });
  }

  const { plan, billing_cycle = "monthly", action } = await req.json() as {
    plan?: string;
    billing_cycle?: "monthly" | "annual";
    action?: "cancel" | "reactivate";
  };

  // ── Cancel subscription ───────────────────────────────────────────────────
  if (action === "cancel") {
    const { data: sub } = await supabase.from("vendor_subscriptions").select("stripe_subscription_id").eq("vendor_id", vendor.id).maybeSingle();
    if (sub?.stripe_subscription_id) {
      const Stripe = (await import("stripe")).default;
      const { assertStripeKey } = await import("@/lib/stripe");
      const stripe = new Stripe(assertStripeKey());
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
      await supabase.from("vendor_subscriptions").update({ cancel_at_period_end: true }).eq("vendor_id", vendor.id);
    }
    void track({ event: "vendor.subscription.cancelled" as never, userId: user.id, properties: { vendor_id: vendor.id } });
    return NextResponse.json({ success: true, message: "Subscription will cancel at period end" });
  }

  // ── Downgrade to free ─────────────────────────────────────────────────────
  if (plan === "free") {
    await supabase.from("vendor_subscriptions").upsert(
      { vendor_id: vendor.id, plan: "free", status: "active" },
      { onConflict: "vendor_id" }
    );
    await supabase.from("vendors").update({ subscription_plan: "free", featured: false }).eq("id", vendor.id);
    void createAuditLog({ actorUserId: user.id, actorRole: "vendor", action: "vendor.profile.update", entityType: "vendor", entityId: vendor.id, before: { plan: vendor.subscription_plan }, after: { plan: "free" } });
    void track({ event: "vendor.subscription.downgraded" as never, userId: user.id, properties: { from: vendor.subscription_plan, to: "free" } });
    return NextResponse.json({ success: true, plan: "free" });
  }

  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan][billing_cycle];
  if (!priceId) {
    return NextResponse.json({ error: `Stripe price ID not configured for ${plan} ${billing_cycle}` }, { status: 500 });
  }

  const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();

  const Stripe = (await import("stripe")).default;
  const { assertStripeKey } = await import("@/lib/stripe");
  const stripe = new Stripe(assertStripeKey());

  const { data: existingSub } = await supabase.from("vendor_subscriptions").select("stripe_customer_id").eq("vendor_id", vendor.id).maybeSingle();
  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name:  profile?.full_name ?? undefined,
      metadata: { vendor_id: vendor.id, user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { vendor_id: vendor.id, plan, billing_cycle, user_id: user.id },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/subscription?success=true&plan=${plan}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/vendor/subscription?cancelled=true`,
    metadata: { vendor_id: vendor.id, plan, billing_cycle },
  });

  return NextResponse.json({ checkout_url: session.url });
}
