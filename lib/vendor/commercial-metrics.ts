import { planMRRContribution } from "@/lib/vendor/entitlements";
import { getEventCounts } from "@/lib/analytics";
import { withoutTestData } from "@/lib/test-vendors";

/**
 * Single source of truth for every commercial number ELBOLD shows anywhere -
 * MRR, ARR, paying vendors, conversion, churn, active subscriptions. Prior to
 * this, /admin/founder and /api/admin/monetization each computed these
 * independently (the founder page's comment claimed it "reuses the exact
 * same computation" but was actually a second, hand-duplicated formula) -
 * they had already silently diverged in production before this existed.
 * Every consumer must call this instead of querying vendor_subscriptions
 * directly.
 */

export interface CommercialMetrics {
  summary: {
    mrr: number;
    arr: number;
    paying_vendors: number;
    total_vendors: number;
    paid_conversion: number;
    past_due_count: number;
    cancelled_count: number;
    at_risk_mrr: number;
  };
  plan_distribution: Record<string, number>;
  category_revenue: Record<string, number>;
  billing_events: BillingEvent[];
  trends: {
    upgrades: number;
    cancels: number;
    failures: number;
    recovered: number;
    net_new: number;
  };
  subscription_funnel: {
    period_days: number;
    page_viewed: number;
    checkout_started: number;
    upgraded: number;
  };
  churn_risk: ChurnRiskVendor[];
}

export interface BillingEvent {
  event_type: string;
  plan_slug: string | null;
  amount_gbp: number | null;
  created_at: string;
  vendor_id: string;
}

export interface ChurnRiskVendor {
  vendor_id: string;
  business_name: string;
  category: string | null;
  plan: string;
  current_period_end: string | null;
  mrr: number;
  reasons: string[];
}

export async function computeCommercialMetrics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts either the typed admin client or a plain SupabaseClient; both expose the same query surface used here
  db: any,
  daysBack = 30
): Promise<CommercialMetrics> {
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  // ── Approved vendors (the population "paying vendors" and "conversion" are measured against) ──
  const { data: approvedVendorRows } = await withoutTestData(
    db.from("vendors").select("id").eq("status", "approved")
  );
  const approvedVendorIds = new Set((approvedVendorRows ?? []).map((v: { id: string }) => v.id));
  const totalVendors = approvedVendorIds.size;

  // ── Subscriptions ──────────────────────────────────────────────────────────
  const { data: subs } = await db
    .from("vendor_subscriptions")
    .select("plan, status, billing_cycle, vendor_id, current_period_end, failed_payment_count, cancel_at_period_end")
    .order("created_at", { ascending: false });

  const allSubs = subs ?? [];
  const activeSubs = allSubs.filter((s: { status: string }) => s.status === "active");
  const pastDueSubs = allSubs.filter((s: { status: string }) => s.status === "past_due");
  const cancelledSubs = allSubs.filter((s: { status: string }) => s.status === "cancelled");

  // "Paying vendors" / conversion is measured only against vendors that are
  // both approved AND actively subscribed - a subscription on a vendor that
  // isn't (or is no longer) approved shouldn't be able to push conversion
  // above 100%, which is the exact bug this replaces (200% conversion in
  // production, from an active sub whose vendor_id wasn't in the approved
  // set at all - most likely leftover/test data, but the arithmetic itself
  // must be bounded regardless of what caused the mismatch).
  const payingApprovedSubs = activeSubs.filter((s: { vendor_id: string }) => approvedVendorIds.has(s.vendor_id));
  const paidVendorCount = payingApprovedSubs.length;

  // ── MRR / ARR ──────────────────────────────────────────────────────────────
  const mrr = payingApprovedSubs.reduce((sum: number, s: { plan: string }) => sum + planMRRContribution(s.plan), 0);
  const arr = mrr * 12;

  // ── Plan distribution ─────────────────────────────────────────────────────
  const planCounts: Record<string, number> = { free: 0, pro: 0, featured: 0, premium: 0, elite: 0 };
  for (const s of payingApprovedSubs) {
    planCounts[s.plan] = (planCounts[s.plan] ?? 0) + 1;
  }
  planCounts.free += Math.max(0, totalVendors - paidVendorCount);

  // ── Revenue by vendor category ────────────────────────────────────────────
  const { data: vendorCats } = await withoutTestData(
    db.from("vendors")
      .select("id, category, subscription_plan")
      .eq("status", "approved")
      .in("subscription_plan", ["pro", "premium", "featured", "elite"])
  );

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

  const events = billingEvents ?? [];
  const upgrades  = events.filter((e: { event_type: string }) => e.event_type === "subscription_started" || e.event_type === "subscription_updated");
  const cancels   = events.filter((e: { event_type: string }) => e.event_type === "subscription_cancelled");
  const failures  = events.filter((e: { event_type: string }) => e.event_type === "payment_failed");
  const recovered = events.filter((e: { event_type: string }) => e.event_type === "payment_succeeded");

  const atRiskMRR = pastDueSubs
    .filter((s: { vendor_id: string }) => approvedVendorIds.has(s.vendor_id))
    .reduce((sum: number, s: { plan: string }) => sum + planMRRContribution(s.plan), 0);

  // ── Churn risk ─────────────────────────────────────────────────────────────
  const churnRiskSubs = payingApprovedSubs.filter(
    (s: { failed_payment_count?: number; cancel_at_period_end?: boolean }) =>
      (s.failed_payment_count ?? 0) > 0 || s.cancel_at_period_end === true
  );
  const churnRiskVendorIds = churnRiskSubs.map((s: { vendor_id: string }) => s.vendor_id).filter(Boolean);
  const { data: churnRiskVendors } = churnRiskVendorIds.length
    ? await db.from("vendors").select("id, business_name, category").in("id", churnRiskVendorIds)
    : { data: [] };
  const churnRiskVendorMap = new Map((churnRiskVendors ?? []).map((v: { id: string }) => [v.id, v]));
  const churnRisk: ChurnRiskVendor[] = churnRiskSubs.map((s: {
    vendor_id: string; plan: string; current_period_end: string | null;
    failed_payment_count?: number; cancel_at_period_end?: boolean;
  }) => {
    const v = churnRiskVendorMap.get(s.vendor_id) as { business_name?: string; category?: string } | undefined;
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

  // ── Subscription conversion funnel ────────────────────────────────────────
  const funnelCounts = await getEventCounts(
    ["vendor.subscription.page_viewed", "vendor.subscription.checkout_started"],
    daysBack
  );

  return {
    summary: {
      mrr,
      arr,
      paying_vendors:  paidVendorCount,
      total_vendors:   totalVendors,
      paid_conversion: totalVendors ? Math.round((paidVendorCount / totalVendors) * 100) : 0,
      past_due_count:  pastDueSubs.filter((s: { vendor_id: string }) => approvedVendorIds.has(s.vendor_id)).length,
      cancelled_count: cancelledSubs.filter((s: { vendor_id: string }) => approvedVendorIds.has(s.vendor_id)).length,
      at_risk_mrr:     atRiskMRR,
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
    subscription_funnel: {
      period_days:      daysBack,
      page_viewed:      funnelCounts["vendor.subscription.page_viewed"] ?? 0,
      checkout_started: funnelCounts["vendor.subscription.checkout_started"] ?? 0,
      upgraded:         upgrades.length,
    },
    churn_risk: churnRisk,
  };
}
