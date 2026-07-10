import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import { computeCommercialMetrics } from "@/lib/vendor/commercial-metrics";
import { computeAtRiskVendorSummary } from "@/lib/vendor/health";
import { fetchVendorGrowthData } from "@/lib/admin/vendor-growth-data";
import { withoutTestData } from "@/lib/test-vendors";
import {
  CheckCircle2, Clock, Users, MessageSquare, ShoppingBag,
  CreditCard, TrendingUp, Target, ArrowRight, Shield,
  Star, AlertCircle, ChevronRight, DollarSign, TrendingDown, UserCheck,
  Sunrise, Sparkles, ShieldAlert, Activity, PieChart,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FounderDashboardPage() {
  const auth = await requireAdminRole("founder");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const [
    { count: pendingVendors    },
    { count: approvedVendors   },
    { count: verifiedVendors   },
    { count: quotesRequested   },
    { count: quotesResponded   },
    { count: bookingsCreated   },
    { count: bookingsCompleted },
    { data: payments           },
    { count: reviewsTotal      },
  ] = await Promise.all([
    withoutTestData(db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending")),
    withoutTestData(db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "approved")),
    withoutTestData(db.from("vendors").select("*", { count: "exact", head: true }).gte("verification_level", 2)),
    db.from("quotes").select("*", { count: "exact", head: true }),
    db.from("quotes").select("*", { count: "exact", head: true }).in("status", ["responded", "viewed", "shortlisted", "accepted", "converted"]),
    db.from("bookings").select("*", { count: "exact", head: true }),
    db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
    db.from("payments").select("amount, commission_amount").eq("status", "succeeded").neq("type", "refund"),
    db.from("reviews").select("*", { count: "exact", head: true }),
  ]);
  // Quotes/bookings/payments/reviews aren't filtered by is_test_data here -
  // that column lives on vendors/profiles, not these tables, and cross-table
  // filtering would need a subquery the Supabase query builder can't express
  // directly. In practice this is a non-issue going forward: migration 071
  // already removed every existing test record's quotes/bookings, and the
  // policy (see lib/test-vendors.ts) is that new test vendors/customers must
  // be marked is_test_data=true at creation - so the vendor/customer counts
  // above (the ones that were actually visibly wrong in production) are
  // fixed; a future test vendor's bookings would still need a manual check
  // if this ever becomes a real problem again.

  const gmv        = (payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const commission = (payments ?? []).reduce((s, p) => s + (p.commission_amount ?? 0), 0);

  // ── Today's operational KPIs (Phase 73) ───────────────────────────────────
  // The rest of this page is all-time cumulative counts - useful for overall
  // health, but a founder opening this every morning needs "what happened
  // since I last looked," not "what's happened ever." Uses created_at, the
  // one timestamp every one of these tables already has - no new columns.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    { count: applicationsToday },
    { count: quotesToday       },
    { count: bookingsToday     },
    { data: paymentsToday      },
  ] = await Promise.all([
    withoutTestData(db.from("vendors").select("*", { count: "exact", head: true }).gte("created_at", todayIso)),
    db.from("quotes").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
    db.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
    db.from("payments").select("amount, commission_amount").eq("status", "succeeded").neq("type", "refund").gte("created_at", todayIso),
  ]);

  const gmvToday        = (paymentsToday ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const commissionToday = (paymentsToday ?? []).reduce((s, p) => s + (p.commission_amount ?? 0), 0);

  // First Booking Mission — 7-step tracker
  const hasQuote        = (quotesRequested ?? 0) > 0;
  const hasResponse     = (quotesResponded ?? 0) > 0;
  const hasBooking      = (bookingsCreated ?? 0) > 0;

  const { count: depositCount } = await db
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .in("payment_status", ["deposit_paid", "fully_paid"]);

  const depositPaid = (depositCount ?? 0) > 0;
  const completed   = (bookingsCompleted ?? 0) > 0;
  const hasReview   = (reviewsTotal ?? 0) > 0;

  // ── Commercial overview ────────────────────────────────────────────────────
  // Calls the same commercial-metrics service /admin/monetization uses -
  // this used to be a hand-duplicated MRR/churn formula that had already
  // silently diverged from the monetization page's numbers in production
  // (confirmed live: this page showed MRR £178 / 200% conversion while
  // monetization showed £0 / 0%, from the same underlying data). One
  // function, one set of numbers, everywhere.
  const commercial = await computeCommercialMetrics(db, 30);
  const { mrr, at_risk_mrr: atRiskMRR, paid_conversion: paidConversion, paying_vendors: payingVendorsCount, cancelled_count: cancelledCount, past_due_count: pastDueCount } = commercial.summary;

  // ── Executive signals (WP-D1, Programme D) ─────────────────────────────────
  // Three reused signals a founder previously had to visit three separate
  // pages to see: vendor quality risk (Governance), application velocity
  // (Vendor Growth), and booking-status distribution (Analytics computes this
  // client-side from a prop; no reusable server function existed for it, so
  // it's queried directly here the same way the counts above already are).
  const [atRiskSummary, growthData, { data: bookingStatusRows }] = await Promise.all([
    computeAtRiskVendorSummary(db),
    fetchVendorGrowthData(),
    db.from("bookings").select("status"),
  ]);
  const bookingStatusCounts = (bookingStatusRows ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  // ── Vendors Needing Attention (WP-D2, Programme D) ─────────────────────────
  // Answers one executive question directly: "which vendors need my
  // attention?" Cross-references quality risk (atRiskSummary.atRiskVendors,
  // Governance's own scoring) against financial risk (commercial.churn_risk,
  // Monetization's own scoring) - both already computed above, zero new
  // queries or duplicated calculations. Where a vendor carries both risks,
  // this merges them into one row instead of showing two separate,
  // disconnected indicators for the same vendor.
  interface UnifiedVendorRisk {
    id: string;
    business_name: string;
    category: string | null;
    qualityTierLabel: string | null;
    qualityFlags: string[];
    financialMRR: number | null;
    financialReasons: string[];
    severity: number;
  }

  const unifiedRiskMap = new Map<string, UnifiedVendorRisk>();

  for (const v of atRiskSummary.atRiskVendors) {
    unifiedRiskMap.set(v.id, {
      id: v.id,
      business_name: v.business_name,
      category: v.category,
      qualityTierLabel: v.tierLabel,
      qualityFlags: v.riskFlags,
      financialMRR: null,
      financialReasons: [],
      severity: v.tier === "critical" ? 3 : 1,
    });
  }
  for (const c of commercial.churn_risk) {
    const existing = unifiedRiskMap.get(c.vendor_id);
    if (existing) {
      existing.financialMRR = c.mrr;
      existing.financialReasons = c.reasons;
      existing.severity = 4; // both quality and financial risk present - highest priority
    } else {
      unifiedRiskMap.set(c.vendor_id, {
        id: c.vendor_id,
        business_name: c.business_name,
        category: c.category,
        qualityTierLabel: null,
        qualityFlags: [],
        financialMRR: c.mrr,
        financialReasons: c.reasons,
        severity: 2,
      });
    }
  }

  const vendorsNeedingAttention = Array.from(unifiedRiskMap.values())
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 10);

  const missionSteps = [
    { label: "Customer requests a quote",          done: hasQuote,    href: "/admin/quotes" },
    { label: "Vendor responds to quote",           done: hasResponse, href: "/admin/quotes" },
    { label: "Customer accepts → booking created", done: hasBooking,  href: "/admin/bookings" },
    { label: "Booking confirmed",                  done: hasBooking,  href: "/admin/bookings" },
    { label: "Deposit paid",                       done: depositPaid, href: "/admin/bookings" },
    { label: "Booking completed",                  done: completed,   href: "/admin/bookings" },
    { label: "Review submitted",                   done: hasReview,   href: "/admin/reviews" },
  ];
  const missionComplete = missionSteps.filter((s) => s.done).length;
  const nextMissionStep = missionSteps.find((s) => !s.done);

  const metrics = [
    { label: "Pending Vendors",      value: pendingVendors ?? 0,    icon: Clock,         color: pendingVendors ? "text-amber-400" : "text-slate-500", href: "/admin/vendors?status=pending", urgent: (pendingVendors ?? 0) > 0 },
    { label: "Approved Vendors",     value: approvedVendors ?? 0,   icon: CheckCircle2,  color: "text-emerald-400",   href: "/admin/vendors?status=approved" },
    { label: "Verified Vendors",     value: verifiedVendors ?? 0,   icon: Shield,        color: "text-blue-400",      href: "/admin/verifications" },
    { label: "Quotes Requested",     value: quotesRequested ?? 0,   icon: MessageSquare, color: "text-brand-400",     href: "/admin/quotes" },
    { label: "Quotes Responded",     value: quotesResponded ?? 0,   icon: TrendingUp,    color: "text-sky-400",       href: "/admin/quotes" },
    { label: "Bookings Created",     value: bookingsCreated ?? 0,   icon: ShoppingBag,   color: "text-slate-400",     href: "/admin/bookings" },
    { label: "Completed Bookings",   value: bookingsCompleted ?? 0, icon: Star,          color: "text-gold-400",      href: "/admin/bookings" },
    { label: "Revenue (GMV)",        value: formatCurrency(gmv),    icon: CreditCard,    color: "text-emerald-400",   href: "/admin/finance" },
    { label: "Commission Earned",    value: formatCurrency(commission), icon: Target,    color: "text-brand-400",     href: "/admin/finance" },
  ];

  return (
    <DashboardLayout user={{ id: auth.user.id, email: auth.user.email ?? "", role: "admin", full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, phone_verified: profile?.phone_verified ?? false, avatar_url: profile?.avatar_url ?? null, created_at: profile?.created_at ?? new Date().toISOString() }} adminRole={auth.role}>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Founder Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Single-screen operational view</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="btn-secondary text-xs py-2">
              <ArrowRight size={13} className="rotate-180" /> Command Centre
            </Link>
            <Link href="/admin/launch" className="btn-secondary text-xs py-2">
              Launch Checklist <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Today — Phase 73 daily operational KPIs */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sunrise size={12} /> Today
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "New Applications", value: applicationsToday ?? 0,        icon: Users,      color: "text-brand-400" },
              { label: "Quotes Requested", value: quotesToday ?? 0,               icon: MessageSquare, color: "text-sky-400" },
              { label: "Bookings Created", value: bookingsToday ?? 0,             icon: Sparkles,   color: "text-emerald-400" },
              { label: "Revenue Today",    value: formatCurrency(gmvToday),       icon: DollarSign, color: "text-emerald-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4 flex flex-col justify-between min-h-[90px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 leading-tight">{label}</span>
                  <Icon size={14} className={color} />
                </div>
                <div className={`font-bold text-white ${typeof value === "string" ? "text-lg" : "text-2xl"}`}>{value}</div>
              </div>
            ))}
          </div>
          {commissionToday > 0 && (
            <p className="text-xs text-slate-500 mt-2">{formatCurrency(commissionToday)} commission earned today</p>
          )}
        </div>

        {/* 9 Core Metrics */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Platform Metrics</h2>
          <div className="grid grid-cols-3 gap-3">
            {metrics.map(({ label, value, icon: Icon, color, href, urgent }) => (
              <Link
                key={label}
                href={href}
                className={`rounded-xl p-4 border transition-colors group flex flex-col justify-between min-h-[90px] ${
                  urgent
                    ? "bg-amber-500/8 border-amber-500/20 hover:border-amber-500/35"
                    : "bg-white/4 border-white/6 hover:border-white/12"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 leading-tight">{label}</span>
                  <Icon size={14} className={color} />
                </div>
                <div className={`text-2xl font-bold ${typeof value === "string" ? "text-lg" : ""} text-white`}>
                  {value}
                </div>
                {urgent && (
                  <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                    <AlertCircle size={10} /> Needs review
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Commercial Overview — MRR/churn, previously only on /admin/monetization */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial Overview</h2>
            <Link href="/admin/monetization" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Full Monetization View <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "MRR",              value: formatCurrency(mrr),      icon: DollarSign,  color: "text-emerald-400" },
              { label: "Paying Vendors",   value: payingVendorsCount,       icon: UserCheck,   color: "text-brand-400" },
              { label: "Paid Conversion",  value: `${paidConversion}%`,     icon: TrendingUp,  color: "text-blue-400" },
              {
                label: "At-Risk MRR",
                value: formatCurrency(atRiskMRR),
                icon: TrendingDown,
                color: atRiskMRR > 0 ? "text-amber-400" : "text-slate-500",
                urgent: atRiskMRR > 0,
              },
            ].map(({ label, value, icon: Icon, color, urgent }) => (
              <div
                key={label}
                className={`rounded-xl p-4 border flex flex-col justify-between min-h-[90px] ${
                  urgent ? "bg-amber-500/8 border-amber-500/20" : "bg-white/4 border-white/6"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 leading-tight">{label}</span>
                  <Icon size={14} className={color} />
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                {urgent && (
                  <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                    <AlertCircle size={10} /> {pastDueCount} past-due
                  </div>
                )}
              </div>
            ))}
          </div>
          {cancelledCount > 0 && (
            <p className="text-xs text-slate-500 mt-2">{cancelledCount} cancelled subscription{cancelledCount === 1 ? "" : "s"} to date</p>
          )}
        </div>

        {/* Executive Signals — reused from Governance, Vendor Growth, Analytics (Programme D, WP-D1) */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Executive Signals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/governance"
              className={`rounded-xl p-4 border transition-colors flex flex-col justify-between min-h-[90px] ${
                atRiskSummary.atRiskCount > 0
                  ? "bg-amber-500/8 border-amber-500/20 hover:border-amber-500/35"
                  : "bg-white/4 border-white/6 hover:border-white/12"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 leading-tight">At-Risk Vendors</span>
                <ShieldAlert size={14} className={atRiskSummary.atRiskCount > 0 ? "text-amber-400" : "text-slate-500"} />
              </div>
              <div className="text-2xl font-bold text-white">{atRiskSummary.atRiskCount}</div>
              <p className="text-xs text-slate-500 mt-1">
                {atRiskSummary.criticalCount > 0 ? `${atRiskSummary.criticalCount} critical · ` : ""}
                of {atRiskSummary.totalApproved} approved
              </p>
            </Link>

            <Link
              href="/admin/vendor-growth"
              className="rounded-xl p-4 border bg-white/4 border-white/6 hover:border-white/12 transition-colors flex flex-col justify-between min-h-[90px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 leading-tight">Applications This Week</span>
                <Activity size={14} className="text-brand-400" />
              </div>
              <div className="text-2xl font-bold text-white">{growthData.appsThisWeek}</div>
              <p className="text-xs text-slate-500 mt-1">{growthData.appsThisMonth} this month</p>
            </Link>

            <div className="rounded-xl p-4 border bg-white/4 border-white/6 flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 leading-tight">Booking Status Mix</span>
                <PieChart size={14} className="text-sky-400" />
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                {Object.entries(bookingStatusCounts).length === 0 ? (
                  <span className="text-slate-500">No bookings yet</span>
                ) : (
                  Object.entries(bookingStatusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="capitalize text-slate-400">{status.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-white">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vendors Needing Attention — unified quality + financial risk (Programme D, WP-D2) */}
        {vendorsNeedingAttention.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendors Needing Attention</h2>
              <span className="text-xs text-slate-500">Quality risk (Governance) + financial risk (Monetization), combined</span>
            </div>
            <div className="bg-white/4 border border-white/6 rounded-2xl divide-y divide-white/4 overflow-hidden">
              {vendorsNeedingAttention.map((v) => (
                <div key={v.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{v.business_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.category ?? "Uncategorised"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {v.qualityTierLabel && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          v.qualityTierLabel === "Critical"
                            ? "bg-red-500/10 text-red-400 border-red-500/25"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        }`}
                        title={v.qualityFlags.join(", ")}
                      >
                        {v.qualityTierLabel} health
                      </span>
                    )}
                    {v.financialMRR !== null && (
                      <span
                        className="text-xs px-2 py-1 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/25"
                        title={v.financialReasons.join(", ")}
                      >
                        {formatCurrency(v.financialMRR)} MRR at risk
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Sorted by combined severity — vendors with both a quality and a financial risk flag first.
            </p>
          </div>
        )}

        {/* First Booking Mission */}
        <div className="bg-white/4 border border-white/6 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target size={15} className="text-brand-400" />
                  First Booking Mission
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {missionComplete}/7 steps complete
                  {missionComplete === 7 ? " — Mission accomplished!" : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{Math.round((missionComplete / 7) * 100)}%</div>
                <div className="text-xs text-slate-500">complete</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${(missionComplete / 7) * 100}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-white/4">
            {missionSteps.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors group"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/6 text-slate-600"
                }`}>
                  {step.done
                    ? <CheckCircle2 size={14} />
                    : <span className="text-xs font-semibold">{i + 1}</span>}
                </div>
                <span className={`flex-1 text-sm ${step.done ? "text-slate-400 line-through" : "text-white"}`}>
                  {step.label}
                </span>
                {!step.done && step === nextMissionStep && (
                  <span className="text-xs text-brand-400 font-medium">Next action</span>
                )}
                <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          {missionComplete === 7 && (
            <div className="p-6 bg-emerald-500/8 border-t border-emerald-500/20 text-center">
              <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-400">First booking completed!</p>
              <p className="text-xs text-slate-400 mt-0.5">Elbold has processed its first real transaction. Scale the model.</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/vendors?status=pending", label: "Review Vendors",  badge: pendingVendors ?? 0 },
            { href: "/admin/vendor-activation",      label: "Activation Funnel", badge: null },
            { href: "/admin/pilot/vendors",          label: "Vendor Relationships", badge: null },
            { href: "/admin/verifications",          label: "Verifications",    badge: null },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white/4 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors flex items-center justify-between group"
            >
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
              <div className="flex items-center gap-2">
                {link.badge ? (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                    {link.badge}
                  </span>
                ) : null}
                <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Next steps if not enough approved vendors */}
        {(approvedVendors ?? 0) < 5 && (
          <div className="bg-brand-500/8 border border-brand-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Vendor pipeline is thin</p>
                <p className="text-xs text-slate-400 mt-1">
                  You have {approvedVendors ?? 0} approved vendor{(approvedVendors ?? 0) !== 1 ? "s" : ""}.
                  Aim for 5+ before inviting the first customers.
                  Use Vendor Relationships to track outreach and the vendor activation funnel to monitor quality.
                </p>
                <div className="flex gap-2 mt-3">
                  <Link href="/admin/pilot/outreach" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    Outreach Templates <ArrowRight size={11} />
                  </Link>
                  <Link href="/founding-vendors" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1" target="_blank">
                    Founding Vendor Page <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
