import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  TrendingUp, Users, CreditCard, AlertTriangle, CheckCircle2,
  XCircle, AlertCircle, ExternalLink, ArrowRight, BarChart3,
  ShoppingBag, Zap, Clock,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";


// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchMetrics() {
  const db = await createAdminClient();
  const now  = new Date();
  const week  = new Date(now.getTime() - 7  * 24 * 3600 * 1000).toISOString();
  const month = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  const [
    // Marketplace
    { count: approvedVendors   },
    { count: pendingVendors    },
    { count: applications30d   },
    // Customer activity
    { count: totalEvents       },
    { count: quotesRequested   },
    { count: quotesResponded   },
    { count: bookingsConfirmed },
    { count: bookingsPending   },
    // Revenue: raw rows
    { data: paymentsAllTime    },
    { data: paymentsThisWeek   },
    { data: paymentsThisMonth  },
    // Risk
    { count: failedPayments    },
    { count: openDisputes      },
    { count: pendingRefunds    },
    { count: stuckBookings     },
  ] = await Promise.all([
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "approved"),
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("vendors").select("*", { count: "exact", head: true }).gte("created_at", month),
    db.from("events").select("*",  { count: "exact", head: true }),
    db.from("quotes").select("*",  { count: "exact", head: true }),
    db.from("quotes").select("*",  { count: "exact", head: true }).in("status", ["responded", "viewed", "shortlisted", "converted"]),
    db.from("bookings").select("*",{ count: "exact", head: true }).eq("status", "confirmed"),
    db.from("bookings").select("*",{ count: "exact", head: true }).eq("status", "pending_payment"),
    db.from("payments").select("amount").eq("status", "succeeded").neq("type", "refund"),
    db.from("payments").select("amount").eq("status", "succeeded").neq("type", "refund").gte("created_at", week),
    db.from("payments").select("amount").eq("status", "succeeded").neq("type", "refund").gte("created_at", month),
    db.from("payments").select("*", { count: "exact", head: true }).eq("status", "failed"),
    db.from("disputes").select("*", { count: "exact", head: true }).in("status", ["open", "pending"]),
    db.from("payments").select("*", { count: "exact", head: true }).eq("type", "refund").eq("status", "pending"),
    // Bookings that are confirmed but still show payment_status !== confirmed (should never happen; diagnostic)
    db.from("bookings").select("*", { count: "exact", head: true })
      .eq("status", "pending_payment").lt("created_at", new Date(now.getTime() - 2 * 3600 * 1000).toISOString()),
  ]);

  const sum = (rows: Array<{ amount?: number }> | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);

  // Category breakdown of approved vendors
  const { data: vendorsByCategory } = await db
    .from("vendors")
    .select("category")
    .eq("status", "approved");

  const catCounts: Record<string, number> = {};
  for (const v of vendorsByCategory ?? []) {
    catCounts[v.category] = (catCounts[v.category] ?? 0) + 1;
  }

  // Infrastructure checks
  const isLiveStripe = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
  const hasResend    = !!process.env.RESEND_API_KEY;
  const hasSentry    = !!process.env.SENTRY_DSN;
  const hasOpenAI    = !!process.env.OPENAI_API_KEY;

  return {
    marketplace: {
      approved: approvedVendors ?? 0,
      pending:  pendingVendors  ?? 0,
      apps30d:  applications30d ?? 0,
    },
    activity: {
      events:    totalEvents     ?? 0,
      quotes:    quotesRequested ?? 0,
      responded: quotesResponded ?? 0,
      confirmed: bookingsConfirmed ?? 0,
      pendingPayment: bookingsPending ?? 0,
    },
    revenue: {
      allTime: sum(paymentsAllTime),
      week:    sum(paymentsThisWeek),
      month:   sum(paymentsThisMonth),
    },
    risk: {
      failedPayments: failedPayments ?? 0,
      openDisputes:   openDisputes   ?? 0,
      pendingRefunds: pendingRefunds ?? 0,
      stuckBookings:  stuckBookings  ?? 0,
    },
    catCounts,
    infra: { isLiveStripe, hasResend, hasSentry, hasOpenAI },
  };
}

// ── Components ────────────────────────────────────────────────────────────────

function Stat({
  label, value, sub, accent = false,
}: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-5">
      <div className="text-xs text-slate-500 mb-1.5 font-light">{label}</div>
      <div className={`text-2xl font-bold mb-0.5 ${accent ? "text-amber-400" : "text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-600 font-light">{sub}</div>}
    </div>
  );
}

function RiskBadge({ count, label, href }: { count: number; label: string; href: string }) {
  const isOk = count === 0;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-4 py-3.5 border transition-colors ${
        isOk
          ? "border-white/6 bg-white/3 hover:bg-white/5"
          : "border-red-500/25 bg-red-500/8 hover:bg-red-500/12"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isOk
          ? <CheckCircle2 size={14} className="text-emerald-400" />
          : <AlertTriangle size={14} className="text-red-400" />}
        <span className={`text-sm font-light ${isOk ? "text-slate-400" : "text-red-300"}`}>
          {label}
        </span>
      </div>
      <div className={`text-sm font-bold ${isOk ? "text-slate-600" : "text-red-400"}`}>
        {count}
      </div>
    </Link>
  );
}

function InfraCheck({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  const Icon  = ok ? CheckCircle2 : warn ? AlertCircle : XCircle;
  const color = ok ? "text-emerald-400" : warn ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-white/4 last:border-0">
      <Icon size={13} className={`${color} flex-shrink-0`} />
      <span className="text-xs text-slate-400 font-light">{label}</span>
    </div>
  );
}

const CAT_LABELS: Record<string, string> = {
  photographer: "Photographers", dj: "DJs", decorator: "Decorators",
  caterer: "Caterers", venue_hire: "Venues", entertainer: "Entertainers",
  cake_designer: "Cake Designers", event_planner: "Event Planners",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminLaunchPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const m = await fetchMetrics();
  const totalRisk = m.risk.failedPayments + m.risk.openDisputes + m.risk.pendingRefunds + m.risk.stuckBookings;

  const conversionRate = m.activity.quotes > 0
    ? Math.round((m.activity.confirmed / m.activity.quotes) * 100) : 0;

  const vendorProfileUser = (profile ?? {
    id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  return (
    <DashboardLayout user={vendorProfileUser} adminRole={auth.role}>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-400" />
              Founder Command Centre
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-light">
              Live marketplace metrics · refreshes on page load ·{" "}
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/vendor-growth"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-slate-400 text-xs hover:text-white transition-colors"
            >
              Vendor Growth <ArrowRight size={11} />
            </Link>
            <Link
              href="/api/health"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/15 transition-colors"
            >
              <ExternalLink size={11} /> Health
            </Link>
          </div>
        </div>

        {/* Risk banner: only shown when alerts exist */}
        {totalRisk > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-5 py-3.5 flex items-center gap-3">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300 font-light">
              {totalRisk} risk alert{totalRisk !== 1 ? "s" : ""} require attention. See Risk section below.
            </span>
          </div>
        )}

        {/* ── MARKETPLACE ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Marketplace</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Approved Vendors"  value={m.marketplace.approved} />
            <Stat label="Pending Review"    value={m.marketplace.pending}  sub="awaiting approval" />
            <Stat label="Applications (30d)" value={m.marketplace.apps30d}  sub="new in 30 days" />
            <Stat label="Founding Target"   value={`${m.marketplace.approved}/20`} sub="founding goal" accent />
          </div>

          {/* Category breakdown */}
          {Object.keys(m.catCounts).length > 0 && (
            <div className="mt-3 bg-white/3 border border-white/6 rounded-xl px-5 py-4">
              <div className="text-xs text-slate-600 mb-3 font-light">Approved by category</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(m.catCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <span key={cat} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-300 font-light">
                      {CAT_LABELS[cat] ?? cat} <span className="text-amber-400 font-semibold">{count}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CUSTOMER ACTIVITY ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer Activity</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Events Created"    value={m.activity.events} />
            <Stat label="Quotes Requested"  value={m.activity.quotes} />
            <Stat label="Quotes Responded"  value={m.activity.responded} sub={`${m.activity.quotes > 0 ? Math.round((m.activity.responded / m.activity.quotes) * 100) : 0}% response rate`} />
            <Stat label="Bookings Confirmed" value={m.activity.confirmed} sub={`${conversionRate}% of quotes`} accent />
          </div>
          {m.activity.pendingPayment > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/6 px-4 py-3 flex items-center gap-3">
              <Clock size={13} className="text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300 font-light">
                {m.activity.pendingPayment} booking{m.activity.pendingPayment !== 1 ? "s" : ""} awaiting payment. Customers may need a reminder.
              </span>
              <Link href="/admin/bookings" className="ml-auto text-xs text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0">
                View →
              </Link>
            </div>
          )}
        </div>

        {/* ── REVENUE ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Revenue</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="All-Time Receipts"  value={`£${m.revenue.allTime.toFixed(2)}`} sub="gross payments received" />
            <Stat label="This Month"         value={`£${m.revenue.month.toFixed(2)}`}   sub="last 30 days" />
            <Stat label="This Week"          value={`£${m.revenue.week.toFixed(2)}`}    sub="last 7 days" accent />
          </div>
          <div className="mt-3 bg-white/3 border border-white/6 rounded-xl px-5 py-3.5">
            <p className="text-xs text-slate-600 font-light">
              Revenue shown is gross customer payments (deposits + full payments, excluding refunds).
              Vendor payouts and platform commission visible in{" "}
              <Link href="/admin/finance" className="text-amber-400 hover:text-amber-300">Admin → Finance</Link>.
            </p>
          </div>
        </div>

        {/* ── RISK ALERTS ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Risk Alerts</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <RiskBadge count={m.risk.failedPayments} label="Failed Payments"      href="/admin/finance" />
            <RiskBadge count={m.risk.openDisputes}   label="Open Disputes"        href="/admin/disputes" />
            <RiskBadge count={m.risk.pendingRefunds} label="Pending Refunds"      href="/admin/finance" />
            <RiskBadge count={m.risk.stuckBookings}  label="Stuck Bookings (>2h)" href="/admin/bookings" />
          </div>
        </div>

        {/* ── INFRASTRUCTURE ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Infrastructure</h2>
          </div>
          <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
            <InfraCheck ok={m.infra.isLiveStripe} warn={!m.infra.isLiveStripe} label={m.infra.isLiveStripe ? "Stripe live mode active" : "Stripe test mode: switch to live key before launch"} />
            <InfraCheck ok={m.infra.hasResend}    label="Resend API key configured" />
            <InfraCheck ok={m.infra.hasSentry}    warn label={m.infra.hasSentry ? "Sentry error monitoring active" : "Sentry DSN not set. Errors are unmonitored."} />
            <InfraCheck ok={m.infra.hasOpenAI}    warn label={m.infra.hasOpenAI ? "OpenAI API key configured (AI planner active)" : "OpenAI key missing. AI planner inactive."} />
            <InfraCheck ok label="Webhook endpoint: /api/payments/webhook (verify in Stripe Dashboard)" />
            <InfraCheck ok label="Cron endpoints: /api/cron/reminders · /api/cron/governance · /api/cron/reconciliation" />
          </div>
        </div>

        {/* ── MILESTONE TRACKER ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Launch Milestones</h2>
          </div>
          <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4 space-y-3">
            {[
              { label: "50 Real Vendors",           done: m.marketplace.approved >= 50,  progress: `${m.marketplace.approved}/50` },
              { label: "First 20 Real Bookings",    done: m.activity.confirmed >= 20,    progress: `${m.activity.confirmed}/20` },
              { label: "First Successful Payout",   done: false,                          progress: "Manual verification required" },
              { label: "First Verified Review",     done: false,                          progress: "Manual verification required" },
              { label: "First £1,000 Revenue",      done: m.revenue.allTime >= 1000,     progress: `£${m.revenue.allTime.toFixed(0)}/£1,000` },
            ].map(({ label, done, progress }) => (
              <div key={label} className="flex items-center gap-3">
                {done
                  ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />}
                <span className={`text-sm font-light flex-1 ${done ? "text-slate-400 line-through" : "text-slate-300"}`}>
                  {label}
                </span>
                <span className="text-xs text-slate-600 font-light flex-shrink-0">{progress}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── QUICK ACTIONS ───────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Approve pending vendors",   href: "/admin/vendors" },
            { label: "View all bookings",         href: "/admin/bookings" },
            { label: "Finance & payouts",         href: "/admin/finance" },
            { label: "Vendor growth dashboard",   href: "/admin/vendor-growth" },
            { label: "User feedback",             href: "/admin/feedback" },
            { label: "SEO roadmap",               href: "/admin/seo" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors text-xs text-slate-300 font-light group"
            >
              {label}
              <ArrowRight size={11} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </Link>
          ))}
        </div>

        <p className="text-slate-700 text-xs text-center">
          Metrics are live from the database. Refresh the page to update.
        </p>
      </div>
    </DashboardLayout>
  );
}
