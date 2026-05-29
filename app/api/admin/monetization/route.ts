import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { planMRRContribution } from "@/lib/vendor/entitlements";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await createAdminClient();
  const { searchParams } = new URL(request.url);
  const daysBack = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  // ── Active subscriptions ──────────────────────────────────────────────────
  const { data: subs } = await db
    .from("vendor_subscriptions")
    .select("plan, status, billing_cycle, vendor_id, current_period_end, failed_payment_count")
    .order("created_at", { ascending: false });

  const activeSubs = (subs ?? []).filter((s) => s.status === "active");
  const pastDueSubs = (subs ?? []).filter((s) => s.status === "past_due");
  const cancelledSubs = (subs ?? []).filter((s) => s.status === "cancelled");

  // ── MRR calculation ───────────────────────────────────────────────────────
  const mrr = activeSubs.reduce((sum, s) => {
    const monthly = planMRRContribution(s.plan);
    if (s.billing_cycle === "annual") return sum + monthly; // already monthly equivalent
    return sum + monthly;
  }, 0);

  const arr = mrr * 12;

  // ── Plan distribution ─────────────────────────────────────────────────────
  const planCounts: Record<string, number> = { free: 0, pro: 0, featured: 0, premium: 0, elite: 0 };
  for (const s of activeSubs) {
    planCounts[s.plan] = (planCounts[s.plan] ?? 0) + 1;
  }

  // Free vendors (no subscription row) — get from vendors table
  const { count: totalVendors } = await db
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const paidVendorCount = activeSubs.length;
  const freeVendorCount = (totalVendors ?? 0) - paidVendorCount;
  planCounts.free += freeVendorCount;

  // ── Revenue by vendor category ────────────────────────────────────────────
  const { data: vendorCats } = await db
    .from("vendors")
    .select("id, category, subscription_plan")
    .in("subscription_plan", ["pro", "premium", "featured", "elite"]);

  const categoryRevenue: Record<string, number> = {};
  for (const v of vendorCats ?? []) {
    const monthly = planMRRContribution(v.subscription_plan);
    categoryRevenue[v.category] = (categoryRevenue[v.category] ?? 0) + monthly;
  }

  // ── Billing events (recent period) ───────────────────────────────────────
  const { data: billingEvents } = await db
    .from("subscription_billing_events")
    .select("event_type, plan_slug, amount_gbp, created_at, vendor_id")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  // ── Upgrade / downgrade trend ─────────────────────────────────────────────
  const events = billingEvents ?? [];
  const upgrades  = events.filter((e) => e.event_type === "subscription_started" || e.event_type === "subscription_updated");
  const cancels   = events.filter((e) => e.event_type === "subscription_cancelled");
  const failures  = events.filter((e) => e.event_type === "payment_failed");
  const recovered = events.filter((e) => e.event_type === "payment_succeeded");

  // ── At-risk revenue (past_due subs) ───────────────────────────────────────
  const atRiskMRR = pastDueSubs.reduce((sum, s) => sum + planMRRContribution(s.plan), 0);

  return NextResponse.json({
    summary: {
      mrr,
      arr,
      paying_vendors:   paidVendorCount,
      total_vendors:    totalVendors ?? 0,
      paid_conversion:  totalVendors ? Math.round((paidVendorCount / totalVendors) * 100) : 0,
      past_due_count:   pastDueSubs.length,
      cancelled_count:  cancelledSubs.length,
      at_risk_mrr:      atRiskMRR,
    },
    plan_distribution: planCounts,
    category_revenue:  categoryRevenue,
    billing_events:    events.slice(0, 50),
    trends: {
      upgrades:  upgrades.length,
      cancels:   cancels.length,
      failures:  failures.length,
      recovered: recovered.length,
      net_new:   upgrades.length - cancels.length,
    },
  });
}
