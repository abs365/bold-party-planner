import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { planMRRContribution } from "@/lib/vendor/entitlements";
import { getEventCounts } from "@/lib/analytics";

export async function GET(request: Request) {
  // Financial settings and MRR data — Global Admin minimum (Founder can change settings; Global Admin can view)
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const daysBack = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  // ── Active subscriptions ──────────────────────────────────────────────────
  const { data: subs } = await auth.db
    .from("vendor_subscriptions")
    .select("plan, status, billing_cycle, vendor_id, current_period_end, failed_payment_count, cancel_at_period_end")
    .order("created_at", { ascending: false });

  const activeSubs = (subs ?? []).filter((s) => s.status === "active");
  const pastDueSubs = (subs ?? []).filter((s) => s.status === "past_due");
  const cancelledSubs = (subs ?? []).filter((s) => s.status === "cancelled");

  // ── MRR calculation ───────────────────────────────────────────────────────
  const mrr = activeSubs.reduce((sum, s) => {
    const monthly = planMRRContribution(s.plan);
    if (s.billing_cycle === "annual") return sum + monthly;
    return sum + monthly;
  }, 0);

  const arr = mrr * 12;

  // ── Plan distribution ─────────────────────────────────────────────────────
  const planCounts: Record<string, number> = { free: 0, pro: 0, featured: 0, premium: 0, elite: 0 };
  for (const s of activeSubs) {
    planCounts[s.plan] = (planCounts[s.plan] ?? 0) + 1;
  }

  const { count: totalVendors } = await auth.db
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const paidVendorCount = activeSubs.length;
  const freeVendorCount = (totalVendors ?? 0) - paidVendorCount;
  planCounts.free += freeVendorCount;

  // ── Revenue by vendor category ────────────────────────────────────────────
  const { data: vendorCats } = await auth.db
    .from("vendors")
    .select("id, category, subscription_plan")
    .in("subscription_plan", ["pro", "premium", "featured", "elite"]);

  const categoryRevenue: Record<string, number> = {};
  for (const v of vendorCats ?? []) {
    const monthly = planMRRContribution(v.subscription_plan);
    categoryRevenue[v.category] = (categoryRevenue[v.category] ?? 0) + monthly;
  }

  // ── Billing events (recent period) ───────────────────────────────────────
  const { data: billingEvents } = await auth.db
    .from("subscription_billing_events")
    .select("event_type, plan_slug, amount_gbp, created_at, vendor_id")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  const events = billingEvents ?? [];
  const upgrades  = events.filter((e) => e.event_type === "subscription_started" || e.event_type === "subscription_updated");
  const cancels   = events.filter((e) => e.event_type === "subscription_cancelled");
  const failures  = events.filter((e) => e.event_type === "payment_failed");
  const recovered = events.filter((e) => e.event_type === "payment_succeeded");

  const atRiskMRR = pastDueSubs.reduce((sum, s) => sum + planMRRContribution(s.plan), 0);

  // ── Churn risk (Phase 73) ─────────────────────────────────────────────────
  // Billing-signal risk, distinct from the existing governance "at risk"
  // system (which flags quality/compliance issues - reviews, response rate,
  // inactivity - and has no concept of failed payments or cancellation
  // intent). failed_payment_count and cancel_at_period_end were already
  // being fetched above for every active sub but never used or shown
  // anywhere - this is the first place either signal surfaces.
  const churnRiskSubs = activeSubs.filter(
    (s) => (s.failed_payment_count ?? 0) > 0 || s.cancel_at_period_end === true
  );
  const churnRiskVendorIds = churnRiskSubs.map((s) => s.vendor_id).filter(Boolean);
  const { data: churnRiskVendors } = churnRiskVendorIds.length
    ? await auth.db.from("vendors").select("id, business_name, category").in("id", churnRiskVendorIds)
    : { data: [] };
  const churnRiskVendorMap = new Map((churnRiskVendors ?? []).map((v) => [v.id, v]));
  const churnRisk = churnRiskSubs.map((s) => {
    const v = churnRiskVendorMap.get(s.vendor_id);
    const reasons: string[] = [];
    if ((s.failed_payment_count ?? 0) > 0) reasons.push(`${s.failed_payment_count} failed payment${s.failed_payment_count === 1 ? "" : "s"}`);
    if (s.cancel_at_period_end) reasons.push("cancels at period end");
    return {
      vendor_id: s.vendor_id,
      business_name: v?.business_name ?? "Unknown vendor",
      category: v?.category ?? null,
      plan: s.plan,
      current_period_end: s.current_period_end,
      mrr: planMRRContribution(s.plan),
      reasons,
    };
  });

  // ── Subscription conversion funnel (Phase 73) ─────────────────────────────
  // Instrumented in a prior pass (vendor.subscription.page_viewed,
  // .checkout_started) but nothing read it back until now - this is the
  // first report showing the actual view -> checkout -> upgrade drop-off.
  const funnelCounts = await getEventCounts(
    ["vendor.subscription.page_viewed", "vendor.subscription.checkout_started"],
    daysBack
  );
  const subscriptionFunnel = {
    period_days:       daysBack,
    page_viewed:       funnelCounts["vendor.subscription.page_viewed"] ?? 0,
    checkout_started:  funnelCounts["vendor.subscription.checkout_started"] ?? 0,
    upgraded:          upgrades.length,
  };

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
    subscription_funnel: subscriptionFunnel,
    churn_risk: churnRisk,
  });
}
