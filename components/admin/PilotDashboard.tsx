"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  TrendingUp, Users, Store, FileText, CheckCircle, ShoppingBag,
  PoundSterling, AlertCircle, Clock, Zap, BarChart3, Target,
  RefreshCw, ArrowRight, BadgeCheck, Star, Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FunnelStep { label: string; count: number; note?: string }

interface PilotVendorRow {
  id: string;
  business_name: string;
  category: string;
  verification_level: number;
  status: string;
  rating: number | null;
  review_count: number;
  response_rate: number | null;
  completed_jobs_count: number;
  last_active_at: string | null;
  created_at: string;
  first_lead: string | null;
  first_quote_submitted: string | null;
  first_booking: string | null;
  health_score: number;
  health_tier: string;
  tags: string[];
  email: string | null;
}

interface HealthData {
  approvedVendors: number;
  pendingVendors: number;
  suspendedVendors: number;
  rejectedVendors: number;
  verifiedL2Plus: number;
  avgRating: number | null;
  avgResponseRate: number | null;
  quoteResponseRate: number | null;
  bookingConvRate: number | null;
  totalCustomers: number;
  totalQuotes: number;
  totalBookings: number;
  totalReviews: number;
  inactiveVendors: number;
  lowResponseVendors: number;
}

interface RevenueData {
  confirmedBookingValue: number;
  completedRevenue: number;
  platformRevenue: number;
  subscriptionRevenue: number;
  totalMarketplaceRevenue: number;
}

interface AlertData {
  pendingVerifications: number;
  activeWarnings: number;
  unreadAlerts: number;
  govFlags: number;
  inactiveVendors: number;
  lowResponseVendors: number;
}

interface LaunchTarget { label: string; current: number; target: number }

interface PeriodKpis {
  quotesRequested: number;
  quotesSubmitted: number;
  quotesAccepted: number;
  bookingsCreated: number;
  revenueTotal: number;
  platformRevenue: number;
  newVendors: number;
  newCustomers: number;
  newReviews: number;
  newEvents: number;
  avgReviewRating: number | null;
}

interface ActivityData {
  quotes24h: number;
  bookings24h: number;
  vendors24h: number;
  reviews24h: number;
  quotes7d: number;
  bookings7d: number;
}

interface Props {
  vendorFunnel:       FunnelStep[];
  customerFunnel:     FunnelStep[];
  verificationLevels: { level: number; count: number }[];
  pilotVendors:       PilotVendorRow[];
  health:             HealthData;
  revenue:            RevenueData;
  alerts:             AlertData;
  launchTargets:      LaunchTarget[];
}

type Period = "24h" | "7d" | "30d";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

function pct(n: number, d: number) {
  if (d === 0) return "0%";
  return Math.round((n / d) * 100) + "%";
}

function verLabel(level: number) {
  return ["Unverified", "Profile Verified", "ID Verified", "Address Verified", "Business Verified", "Trusted Pro"][level] ?? `Level ${level}`;
}

const TIER_COLORS: Record<string, string> = {
  excellent: "text-emerald-400",
  good:      "text-blue-400",
  fair:      "text-yellow-400",
  poor:      "text-orange-400",
  critical:  "text-red-400",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/4 border border-white/6 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color = "text-brand-400" }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-white font-bold text-xl leading-tight truncate">{value}</p>
        <p className="text-white/40 text-xs">{label}</p>
        {sub && <p className="text-white/25 text-xs">{sub}</p>}
      </div>
    </Card>
  );
}

function FunnelBar({ steps, maxWidth = 100 }: { steps: FunnelStep[]; maxWidth?: number }) {
  const top = steps[0]?.count ?? 1;
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const w = top > 0 ? Math.max(4, Math.round((step.count / top) * maxWidth)) : 4;
        const dropPct = i > 0 ? pct(step.count, steps[i - 1].count) : "100%";
        return (
          <div key={step.label} className="flex items-center gap-3 text-sm">
            <div className="w-40 text-white/60 text-xs text-right shrink-0">{step.label}</div>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="h-7 rounded-md bg-brand-500/30 border border-brand-500/20 flex items-center pl-2.5 transition-all"
                style={{ width: `${w}%` }}
              >
                <span className="text-white font-bold text-xs">{step.count.toLocaleString()}</span>
              </div>
              {i > 0 && (
                <span className="text-white/30 text-xs shrink-0">{dropPct}</span>
              )}
            </div>
            {step.note && <span className="text-white/20 text-xs shrink-0 hidden sm:block">{step.note}</span>}
          </div>
        );
      })}
    </div>
  );
}

function LaunchTarget({ label, current, target }: LaunchTarget) {
  const pctNum = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0);
  const done   = current >= target;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className={done ? "text-emerald-400 font-bold" : "text-white/50"}>
          {current} / {target}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-brand-500"}`}
          style={{ width: `${pctNum}%` }}
        />
      </div>
      <p className="text-white/30 text-xs text-right">{pctNum}%</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PilotDashboard({
  vendorFunnel, customerFunnel, verificationLevels,
  pilotVendors, health, revenue, alerts, launchTargets,
}: Props) {
  const [period, setPeriod]   = useState<Period>("30d");
  const [kpis,   setKpis]     = useState<PeriodKpis | null>(null);
  const [act,    setAct]      = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPeriod = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pilot?period=${p}`);
      if (res.ok) {
        const data = await res.json() as { kpis: PeriodKpis; activity: ActivityData };
        setKpis(data.kpis);
        setAct(data.activity);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPeriod(period); }, [period, loadPeriod]);

  function handlePeriod(p: Period) { setPeriod(p); }

  const periodLabel: Record<Period, string> = { "24h": "24 hours", "7d": "7 days", "30d": "30 days" };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">

      {/* ── PERIOD SELECTOR ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-white/50 text-sm">Showing time-period KPIs for the last {periodLabel[period]}</p>
        <div className="flex gap-1.5">
          {(["24h", "7d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                period === p
                  ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                  : "bg-white/4 border-white/10 text-white/50 hover:bg-white/8"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => void loadPeriod(period)}
            className="px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/10 text-white/40 hover:bg-white/8 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── SECTION 1: KPI CARDS ── */}
      <section>
        <SectionHeader title="Pilot KPIs" sub={`Activity over the last ${periodLabel[period]}`} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <KpiCard icon={Store}        label="New Vendors"         value={loading ? "..." : (kpis?.newVendors ?? 0)}    color="text-slate-400" />
          <KpiCard icon={Users}        label="New Customers"       value={loading ? "..." : (kpis?.newCustomers ?? 0)}  color="text-blue-400" />
          <KpiCard icon={FileText}     label="Quote Requests"      value={loading ? "..." : (kpis?.quotesRequested ?? 0)} color="text-yellow-400" />
          <KpiCard icon={TrendingUp}   label="Quotes Submitted"    value={loading ? "..." : (kpis?.quotesSubmitted ?? 0)} color="text-amber-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={CheckCircle}  label="Quotes Accepted"     value={loading ? "..." : (kpis?.quotesAccepted ?? 0)}  color="text-emerald-400" />
          <KpiCard icon={ShoppingBag}  label="Bookings Created"    value={loading ? "..." : (kpis?.bookingsCreated ?? 0)} color="text-green-400" />
          <KpiCard icon={PoundSterling} label="Booking Value"       value={loading ? "..." : fmt(kpis?.revenueTotal ?? 0)} color="text-brand-400" />
          <KpiCard icon={Star}         label="New Reviews"         value={loading ? "..." : (kpis?.newReviews ?? 0)}       color="text-yellow-400" />
        </div>
      </section>

      {/* ── SECTION 7 + 8: REVENUE + HEALTH side by side ── */}
      <div className="grid sm:grid-cols-2 gap-6">

        {/* Revenue */}
        <section>
          <SectionHeader title="Revenue Tracking" sub="All-time totals from bookings and subscriptions" />
          <Card className="p-5 space-y-3">
            {[
              { label: "Accepted Quote Value",    value: fmt(revenue.confirmedBookingValue), sub: "confirmed + completed bookings" },
              { label: "Completed Revenue",       value: fmt(revenue.completedRevenue),      sub: "completed bookings only" },
              { label: "Platform Earnings (10%)", value: fmt(revenue.platformRevenue),       sub: "ELBOLD commission on completed" },
              { label: "Subscription MRR",        value: fmt(revenue.subscriptionRevenue),   sub: "active paid subscriptions" },
              { label: "Total Marketplace Value", value: fmt(revenue.totalMarketplaceRevenue), sub: "commission + subscriptions" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white/70 text-sm">{label}</p>
                  <p className="text-white/30 text-xs">{sub}</p>
                </div>
                <p className="text-white font-bold">{value}</p>
              </div>
            ))}
          </Card>
        </section>

        {/* Marketplace Health */}
        <section>
          <SectionHeader title="Marketplace Health" sub="All-time platform metrics" />
          <Card className="p-5 space-y-3">
            {[
              { label: "Approved Vendors",       value: health.approvedVendors },
              { label: "Pending Vendors",        value: health.pendingVendors },
              { label: "Suspended Vendors",      value: health.suspendedVendors },
              { label: "Total Customers",        value: health.totalCustomers },
              { label: "Total Quote Requests",   value: health.totalQuotes },
              { label: "Total Bookings",         value: health.totalBookings },
              { label: "Total Reviews",          value: health.totalReviews },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <p className="text-white/60 text-sm">{label}</p>
                <p className="text-white font-semibold">{value.toLocaleString()}</p>
              </div>
            ))}
            <div className="pt-2 space-y-1.5">
              {[
                { label: "Avg Vendor Rating",    value: health.avgRating != null ? health.avgRating.toFixed(2) + " / 5" : "No data" },
                { label: "Quote Response Rate",  value: health.quoteResponseRate != null ? health.quoteResponseRate + "%" : "No data" },
                { label: "Booking Conv. Rate",   value: health.bookingConvRate != null ? health.bookingConvRate + "%" : "No data" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <p className="text-white/60 text-sm">{label}</p>
                  <p className="text-brand-400 font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* ── SECTION 4: MARKETPLACE ACTIVITY ── */}
      <section>
        <SectionHeader title="Marketplace Activity" sub="Volume over time" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Quotes",    v24: act?.quotes24h ?? 0,   v7: loading ? "..." : (kpis?.quotesRequested ?? 0),  icon: FileText,  color: "text-yellow-400" },
            { label: "Bookings",  v24: act?.bookings24h ?? 0, v7: loading ? "..." : (kpis?.bookingsCreated ?? 0),  icon: ShoppingBag, color: "text-green-400" },
            { label: "Vendors",   v24: act?.vendors24h ?? 0,  v7: loading ? "..." : (kpis?.newVendors ?? 0),       icon: Store,    color: "text-slate-400" },
            { label: "Reviews",   v24: act?.reviews24h ?? 0,  v7: loading ? "..." : (kpis?.newReviews ?? 0),       icon: Star,     color: "text-amber-400" },
          ].map(({ label, v24, v7, icon: Icon, color }) => (
            <Card key={label} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={14} className={color} />
                <p className="text-white/60 text-xs font-medium">{label}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-white font-bold text-xl">{v24}</p>
                  <p className="text-white/30 text-xs">24 h</p>
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{v7}</p>
                  <p className="text-white/30 text-xs">{periodLabel[period]}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── SECTIONS 2 + 3: FUNNELS ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader title="Vendor Funnel" sub="Registration to first booking conversion" />
          <Card className="p-5">
            <FunnelBar steps={vendorFunnel} />
            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 text-center gap-2 text-xs">
              <div>
                <p className="text-white font-bold">{pct(vendorFunnel[2]?.count ?? 0, vendorFunnel[0]?.count ?? 1)}</p>
                <p className="text-white/30">Approval rate</p>
              </div>
              <div>
                <p className="text-white font-bold">{pct(vendorFunnel[5]?.count ?? 0, vendorFunnel[2]?.count ?? 1)}</p>
                <p className="text-white/30">Lead rate</p>
              </div>
              <div>
                <p className="text-white font-bold">{pct(vendorFunnel[7]?.count ?? 0, vendorFunnel[5]?.count ?? 1)}</p>
                <p className="text-white/30">Win rate</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader title="Customer Funnel" sub="Signup to confirmed booking" />
          <Card className="p-5">
            <FunnelBar steps={customerFunnel} />
            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 text-center gap-2 text-xs">
              <div>
                <p className="text-white font-bold">{pct(customerFunnel[1]?.count ?? 0, customerFunnel[0]?.count ?? 1)}</p>
                <p className="text-white/30">Event creation</p>
              </div>
              <div>
                <p className="text-white font-bold">{pct(customerFunnel[2]?.count ?? 0, customerFunnel[0]?.count ?? 1)}</p>
                <p className="text-white/30">Quote rate</p>
              </div>
              <div>
                <p className="text-white font-bold">{pct(customerFunnel[5]?.count ?? 0, customerFunnel[2]?.count ?? 1)}</p>
                <p className="text-white/30">Booking rate</p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* ── SECTION 5: VERIFICATION LEVELS ── */}
      <section>
        <SectionHeader title="Verification Progress" sub="Vendor distribution by trust level" />
        <Card className="p-5">
          <div className="space-y-3">
            {verificationLevels.map(({ level, count }) => {
              const total = verificationLevels.reduce((s, v) => s + v.count, 0);
              const w = total > 0 ? Math.max(2, Math.round((count / total) * 100)) : 2;
              const colors = ["bg-slate-500/40", "bg-green-500/40", "bg-emerald-500/50", "bg-blue-500/50", "bg-amber-500/50"];
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-36 text-right shrink-0">
                    <span className="text-white/60 text-xs">{verLabel(level)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-white/4 rounded-md overflow-hidden">
                      <div
                        className={`h-full ${colors[level] ?? "bg-white/20"} flex items-center pl-2 transition-all`}
                        style={{ width: `${w}%` }}
                      >
                        <span className="text-white/80 text-xs font-bold">{count}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-white/30 text-xs w-12 text-right shrink-0">
                    {pct(count, total)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock size={12} />
              <span>{health.approvedVendors - health.verifiedL2Plus} approved vendors awaiting document verification</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ── SECTION 6: PILOT VENDOR TRACKER ── */}
      <section>
        <SectionHeader
          title="Pilot Vendor Tracker"
          sub={`${pilotVendors.length} approved vendor${pilotVendors.length !== 1 ? "s" : ""} · milestones and health`}
        />
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-white/40 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-center px-3 py-3 font-medium">Level</th>
                  <th className="text-left px-4 py-3 font-medium">First Lead</th>
                  <th className="text-left px-4 py-3 font-medium">First Quote</th>
                  <th className="text-left px-4 py-3 font-medium">First Booking</th>
                  <th className="text-left px-4 py-3 font-medium">Last Activity</th>
                  <th className="text-center px-3 py-3 font-medium">Health</th>
                  <th className="text-left px-4 py-3 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pilotVendors.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-white/30 text-sm">
                      No approved vendors yet
                    </td>
                  </tr>
                )}
                {pilotVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">{v.business_name}</p>
                      {v.email && <p className="text-white/30 text-xs">{v.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs capitalize">
                      {v.category.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-bold ${
                        v.verification_level >= 2 ? "text-blue-400" :
                        v.verification_level >= 1 ? "text-green-400" :
                        "text-white/30"
                      }`}>
                        L{v.verification_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {v.first_lead
                        ? formatDistanceToNow(new Date(v.first_lead), { addSuffix: true })
                        : <span className="text-white/20">None</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {v.first_quote_submitted
                        ? formatDistanceToNow(new Date(v.first_quote_submitted), { addSuffix: true })
                        : <span className="text-white/20">None</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {v.first_booking
                        ? <span className="text-emerald-400 font-semibold">{formatDistanceToNow(new Date(v.first_booking), { addSuffix: true })}</span>
                        : <span className="text-white/20">None</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">
                      {v.last_active_at
                        ? formatDistanceToNow(new Date(v.last_active_at), { addSuffix: true })
                        : <span className="text-white/20">Never</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-bold ${TIER_COLORS[v.health_tier] ?? "text-white/40"}`}>
                        {v.health_score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {v.tags.map((tag) => (
                          <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${
                            tag === "Pilot Vendor"   ? "bg-brand-500/20 border-brand-500/30 text-brand-300" :
                            tag === "High Potential" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                            "bg-white/8 border-white/12 text-white/50"
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ── SECTIONS 9 + 10: ALERTS + LAUNCH READINESS ── */}
      <div className="grid sm:grid-cols-2 gap-6">

        {/* Operational Alerts */}
        <section>
          <SectionHeader title="Operational Alerts" sub="Items requiring attention" />
          <Card className="p-5 space-y-2.5">
            {[
              { label: "Pending Verifications",  count: alerts.pendingVerifications, icon: BadgeCheck, href: "/admin/verifications", urgent: alerts.pendingVerifications > 0 },
              { label: "Active Gov. Warnings",   count: alerts.activeWarnings,       icon: AlertCircle, href: "/admin/governance",    urgent: alerts.activeWarnings > 0 },
              { label: "Unread Admin Alerts",    count: alerts.unreadAlerts,         icon: Activity,    href: "/admin",               urgent: alerts.unreadAlerts > 5 },
              { label: "Governance Flags",       count: alerts.govFlags,             icon: AlertCircle, href: "/admin/governance",    urgent: alerts.govFlags > 0 },
              { label: "Inactive Vendors (30d)", count: alerts.inactiveVendors,      icon: Clock,       href: "/admin/vendors",       urgent: alerts.inactiveVendors > 0 },
              { label: "Low Response Vendors",   count: alerts.lowResponseVendors,   icon: Zap,         href: "/admin/vendors",       urgent: alerts.lowResponseVendors > 0 },
            ].map(({ label, count, icon: Icon, href, urgent }) => (
              <a
                key={label}
                href={href}
                className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} className={urgent && count > 0 ? "text-red-400" : "text-white/30"} />
                  <span className="text-white/60 text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${urgent && count > 0 ? "text-red-400" : count === 0 ? "text-emerald-400" : "text-white/50"}`}>
                    {count}
                  </span>
                  <ArrowRight size={12} className="text-white/20" />
                </div>
              </a>
            ))}
          </Card>
        </section>

        {/* CEO Launch Readiness */}
        <section>
          <SectionHeader title="CEO Launch Readiness" sub="Pilot programme targets" />
          <Card className="p-5">
            <div className="space-y-5">
              {launchTargets.map((t) => (
                <LaunchTarget key={t.label} {...t} />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/6">
              {(() => {
                const done  = launchTargets.filter((t) => t.current >= t.target).length;
                const total = launchTargets.length;
                const overall = Math.round((done / total) * 100);
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-brand-400" />
                      <span className="text-white/60 text-sm">Overall readiness</span>
                    </div>
                    <span className={`font-bold text-lg ${overall >= 100 ? "text-emerald-400" : overall >= 60 ? "text-brand-400" : "text-white/50"}`}>
                      {overall}%
                    </span>
                  </div>
                );
              })()}
              <a
                href="/admin/launch"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-medium hover:bg-brand-500/15 transition-colors"
              >
                <BarChart3 size={12} /> Full Launch Readiness Checklist
              </a>
            </div>
          </Card>
        </section>
      </div>

    </div>
  );
}
