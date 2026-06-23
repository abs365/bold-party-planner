import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { planMRRContribution } from "@/lib/vendor/entitlements";
import { assertStripeKey } from "@/lib/stripe";
import {
  TrendingUp, Wallet, CreditCard, AlertTriangle, CheckCircle2,
  RefreshCcw, BarChart2, ChevronRight, ShieldAlert, Clock,
  ArrowUpRight, Ban, RotateCcw, Activity, DollarSign, Zap,
} from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export default async function FinanceDashboard() {
  const auth = await requireAdminRole("global_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const now       = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthAgo   = new Date(now); monthAgo.setDate(now.getDate() - 30);
  const weekAgo    = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const yesterday  = new Date(now); yesterday.setDate(now.getDate() - 1);

  // ── All DB queries in parallel ────────────────────────────────────────────
  const [
    paymentsRes,
    subsRes,
    payoutsRes,
    disputesRes,
    recentPaymentsRes,
    bookingsRes,
    webhookEventsRes,
    latestReconRes,
    ledgerRes,
    finEventsRes,
    refundFailuresRes,
  ] = await Promise.all([
    db.from("payments").select("id, amount, type, status, created_at, booking_id, stripe_payment_intent_id").order("created_at", { ascending: false }),
    db.from("vendor_subscriptions").select("plan, status, billing_cycle, failed_payment_count, current_period_end"),
    db.from("vendor_payouts").select("id, amount, status, created_at, vendor_id").order("created_at", { ascending: false }),
    db.from("disputes").select("id, status, created_at").eq("status", "open"),
    db.from("payments").select("id, amount, type, status, created_at, booking_id").order("created_at", { ascending: false }).limit(12),
    db.from("bookings").select("commission_amount, total_amount, payment_status, vendor_payout, created_at"),
    db.from("stripe_events").select("id, type, processed_at").gte("processed_at", yesterday.toISOString()).order("processed_at", { ascending: false }).limit(200),
    db.from("reconciliation_runs").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("financial_ledger").select("gross_amount, refund_amount, platform_commission_amount, vendor_amount, payment_status, payout_status, created_at"),
    db.from("financial_events").select("event_type, created_at").order("created_at", { ascending: false }).limit(8),
    db.from("audit_logs").select("entity_id, new_values, created_at").eq("action", "booking.refund.partial_failure").order("created_at", { ascending: false }).limit(10),
  ]);

  const allPayments    = paymentsRes.data    ?? [];
  const subs           = subsRes.data         ?? [];
  const payouts        = payoutsRes.data       ?? [];
  const disputes       = disputesRes.data      ?? [];
  const recentPayments = recentPaymentsRes.data ?? [];
  const bookings       = bookingsRes.data      ?? [];
  const webhookEvents  = webhookEventsRes.data ?? [];
  const latestRecon    = latestReconRes.data   ?? null;
  const ledger         = ledgerRes.data        ?? [];
  const finEvents      = finEventsRes.data     ?? [];
  const refundFailures = refundFailuresRes.data ?? [];

  // ── Stripe balance (live API — non-fatal) ─────────────────────────────────
  let stripeBalance: { available: number; pending: number } | null = null;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(assertStripeKey());
    const bal = await stripe.balance.retrieve();
    const avail   = bal.available.find((b) => b.currency === "gbp");
    const pend    = bal.pending.find((b) => b.currency === "gbp");
    stripeBalance = {
      available: (avail?.amount ?? 0) / 100,
      pending:   (pend?.amount  ?? 0) / 100,
    };
  } catch {
    // Non-fatal — Stripe key may be non-live or unavailable
  }

  // ── Payment segmentation ──────────────────────────────────────────────────
  const succeeded   = allPayments.filter((p) => p.status === "succeeded" && (p.type === "deposit" || p.type === "full"));
  const refunded    = allPayments.filter((p) => p.status === "succeeded" && p.type === "refund");
  const failed      = allPayments.filter((p) => p.status === "failed");

  const todaySucc   = succeeded.filter((p) => new Date(p.created_at) >= todayStart);
  const weekSucc    = succeeded.filter((p) => new Date(p.created_at) >= weekAgo);
  const monthSucc   = succeeded.filter((p) => new Date(p.created_at) >= monthAgo);
  const monthRefund = refunded.filter((p)  => new Date(p.created_at) >= monthAgo);
  const monthFailed = failed.filter((p)    => new Date(p.created_at) >= monthAgo);

  const dailyGMV   = todaySucc.reduce((s, p)  => s + Number(p.amount), 0);
  const weeklyGMV  = weekSucc.reduce((s, p)   => s + Number(p.amount), 0);
  const monthlyGMV = monthSucc.reduce((s, p)  => s + Number(p.amount), 0);
  const allTimeGMV = succeeded.reduce((s, p)  => s + Number(p.amount), 0);
  const refundTotal= monthRefund.reduce((s, p) => s + Number(p.amount), 0);

  const refundRate = allTimeGMV > 0 ? (refunded.reduce((s, p) => s + Number(p.amount), 0) / allTimeGMV) * 100 : 0;

  // ── Commission ────────────────────────────────────────────────────────────
  const dailyCommission   = dailyGMV  * 0.10;
  const monthlyCommission = monthlyGMV * 0.10;
  const allTimeCommission = allTimeGMV * 0.10;

  // ── Subscriptions ─────────────────────────────────────────────────────────
  const activeSubs  = subs.filter((s) => s.status === "active");
  const pastDueSubs = subs.filter((s) => s.status === "past_due");
  const mrr         = activeSubs.reduce((sum, s) => sum + planMRRContribution(s.plan ?? "free"), 0);
  const arr         = mrr * 12;
  const atRiskMRR   = pastDueSubs.reduce((sum, s) => sum + planMRRContribution(s.plan ?? "free"), 0);

  // ── Payouts ───────────────────────────────────────────────────────────────
  const pendingPayouts     = payouts.filter((p) => p.status === "pending");
  const pendingPayoutTotal = pendingPayouts.reduce((s, p) => s + Number(p.amount), 0);
  const overduePayouts     = pendingPayouts.filter((p) => new Date(p.created_at) < new Date(Date.now() - 7 * 86400000));

  // ── Reconciliation ────────────────────────────────────────────────────────
  const paidBookings = bookings.filter((b) => b.payment_status === "deposit_paid" || b.payment_status === "fully_paid");
  const expectedCommission = allTimeGMV * 0.10;
  const actualCommission   = paidBookings.reduce((s, b) => s + Number(b.commission_amount ?? 0), 0);
  const commissionDrift    = Math.abs(expectedCommission - actualCommission);
  const isReconciled       = commissionDrift < 0.02;

  // Ledger metrics
  const ledgerGMV          = ledger.filter(l => l.payment_status === "paid").reduce((s, l) => s + Number(l.gross_amount), 0);
  const ledgerPendingPayout = ledger
    .filter(l => l.payout_status === "not_due" || l.payout_status === "scheduled")
    .reduce((s, l) => s + Number(l.vendor_amount ?? 0), 0);

  // Reconciliation status — prefer latest DB run; compute inline if no run exists
  const reconStatus = (latestRecon?.status ?? (isReconciled ? "healthy" : commissionDrift < 50 ? "warning" : "critical")) as "healthy" | "warning" | "critical";
  const reconColor  = reconStatus === "healthy"  ? "text-emerald-400" :
                      reconStatus === "warning"   ? "text-amber-400"   : "text-red-400";
  const reconBorder = reconStatus === "healthy"  ? "border-emerald-500/15 bg-emerald-500/5" :
                      reconStatus === "warning"   ? "border-amber-500/15 bg-amber-500/8"     : "border-red-500/25 bg-red-500/8";

  // ── Webhook health ────────────────────────────────────────────────────────
  const webhook24h      = webhookEvents.length;
  const checkoutEvents  = webhookEvents.filter((e) => e.type === "checkout.session.completed").length;
  const failureEvents   = webhookEvents.filter((e) => e.type === "payment_intent.payment_failed").length;

  const safeUser: Profile = profile ?? {
    id: auth.user.id, email: auth.user.email ?? "", role: "admin",
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  };

  return (
    <DashboardLayout user={safeUser} adminRole={auth.role}>
      <div className="max-w-7xl mx-auto space-y-7">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time financial health &middot;{" "}
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <form action="/api/admin/reconciliation" method="GET">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-500/25 text-xs text-brand-400 hover:bg-brand-500/20 transition-colors">
                <RefreshCcw size={12} />Run Reconciliation
              </button>
            </form>
            <Link href="/admin/payouts" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-slate-300 hover:border-white/15 transition-colors">
              <Wallet size={12} />Payouts
            </Link>
          </div>
        </div>

        {/* ── Alert Bar ─────────────────────────────────────────────────────── */}
        {(reconStatus !== "healthy" || overduePayouts.length > 0 || pastDueSubs.length > 0 || monthFailed.length > 0 || refundFailures.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {reconStatus === "critical" && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                <ShieldAlert size={13} />Reconciliation critical: {fmt(commissionDrift)} commission drift &mdash; run reconciliation runbook
              </div>
            )}
            {reconStatus === "warning" && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs">
                <AlertTriangle size={13} />Reconciliation warning: {fmt(commissionDrift)} commission drift
              </div>
            )}
            {overduePayouts.length > 0 && (
              <Link href="/admin/payouts" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs hover:bg-amber-500/15">
                <Clock size={13} />{overduePayouts.length} payout{overduePayouts.length > 1 ? "s" : ""} overdue &gt;7 days<ChevronRight size={12} />
              </Link>
            )}
            {pastDueSubs.length > 0 && (
              <Link href="/admin/subscriptions" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs hover:bg-amber-500/15">
                <AlertTriangle size={13} />{pastDueSubs.length} sub{pastDueSubs.length > 1 ? "s" : ""} past due &middot; {fmt(atRiskMRR)}/mo at risk<ChevronRight size={12} />
              </Link>
            )}
            {monthFailed.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                <Ban size={13} />{monthFailed.length} failed payment{monthFailed.length > 1 ? "s" : ""} this month
              </div>
            )}
            {refundFailures.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs">
                <RotateCcw size={13} />{refundFailures.length} refund{refundFailures.length > 1 ? "s" : ""} with partial failure &mdash; Stripe paid but secondary step(s) failed
              </div>
            )}
          </div>
        )}

        {/* ── GMV Row ──────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Gross Merchandise Value</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Today",      value: fmt(dailyGMV),   sub: `${todaySucc.length} payments`,   color: "text-emerald-400", icon: TrendingUp },
              { label: "This Week",  value: fmt(weeklyGMV),  sub: `${weekSucc.length} payments`,    color: "text-brand-400",   icon: TrendingUp },
              { label: "This Month", value: fmt(monthlyGMV), sub: `${monthSucc.length} paid &middot; ${monthFailed.length} failed`, color: "text-blue-400", icon: BarChart2 },
              { label: "All Time",   value: fmt(allTimeGMV), sub: `${succeeded.length} total transactions`, color: "text-slate-400", icon: BarChart2 },
            ].map(({ label, value, sub, color, icon: Icon }) => (
              <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={12} className={color} />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
                <div className="text-xl font-bold text-white tabular-nums">{value}</div>
                <div className="text-xs text-slate-600 mt-0.5" dangerouslySetInnerHTML={{ __html: sub }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Commission + MRR + Payouts + Stripe Balance ───────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/4 border border-white/6 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2"><CreditCard size={12} className="text-gold-400" /><span className="text-xs text-slate-500">Platform Revenue (Month)</span></div>
            <div className="text-xl font-bold text-white tabular-nums">{fmt(monthlyCommission)}</div>
            <div className="text-xs text-slate-600 mt-0.5">10% of {fmt(monthlyGMV)} GMV &middot; all-time {fmt(allTimeCommission)}</div>
          </div>

          <div className="bg-white/4 border border-white/6 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2"><ArrowUpRight size={12} className="text-emerald-400" /><span className="text-xs text-slate-500">Subscription MRR</span></div>
            <div className="text-xl font-bold text-white tabular-nums">{fmt(mrr)}</div>
            <div className="text-xs text-slate-600 mt-0.5">{activeSubs.length} active &middot; ARR {fmt(arr)}</div>
          </div>

          <div className={`border rounded-xl p-4 ${pendingPayoutTotal > 0 ? "bg-amber-500/6 border-amber-500/20" : "bg-white/4 border-white/6"}`}>
            <div className="flex items-center gap-1.5 mb-2"><Wallet size={12} className={pendingPayoutTotal > 0 ? "text-amber-400" : "text-slate-500"} /><span className="text-xs text-slate-500">Outstanding Vendor Liability</span></div>
            <div className={`text-xl font-bold tabular-nums ${pendingPayoutTotal > 0 ? "text-amber-400" : "text-white"}`}>{fmt(pendingPayoutTotal)}</div>
            <div className="text-xs text-slate-600 mt-0.5">{pendingPayouts.length} pending &middot; {overduePayouts.length > 0 ? `${overduePayouts.length} overdue` : "all current"}</div>
          </div>

          {stripeBalance !== null ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2"><DollarSign size={12} className="text-blue-400" /><span className="text-xs text-slate-500">Stripe Balance (Live)</span></div>
              <div className="text-xl font-bold text-white tabular-nums">{fmt(stripeBalance.available)}</div>
              <div className="text-xs text-slate-600 mt-0.5">available &middot; {fmt(stripeBalance.pending)} pending</div>
            </div>
          ) : (
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2"><DollarSign size={12} className="text-slate-600" /><span className="text-xs text-slate-500">Stripe Balance</span></div>
              <div className="text-sm font-medium text-slate-600">Unavailable</div>
              <div className="text-xs text-slate-700 mt-0.5">Live key required</div>
            </div>
          )}
        </div>

        {/* ── Failures + Refunds + Disputes + Reconciliation ───────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`border rounded-xl p-4 ${monthFailed.length > 0 ? "bg-red-500/6 border-red-500/20" : "bg-white/4 border-white/6"}`}>
            <div className="flex items-center gap-1.5 mb-2"><Ban size={12} className={monthFailed.length > 0 ? "text-red-400" : "text-slate-500"} /><span className="text-xs text-slate-500">Failed Payments (30d)</span></div>
            <div className={`text-xl font-bold tabular-nums ${monthFailed.length > 0 ? "text-red-400" : "text-white"}`}>{monthFailed.length}</div>
            <div className="text-xs text-slate-600 mt-0.5">{failed.length} all time</div>
          </div>

          <div className={`border rounded-xl p-4 ${refundTotal > 0 ? "bg-amber-500/6 border-amber-500/20" : "bg-white/4 border-white/6"}`}>
            <div className="flex items-center gap-1.5 mb-2"><RotateCcw size={12} className={refundTotal > 0 ? "text-amber-400" : "text-slate-500"} /><span className="text-xs text-slate-500">Refunds (30d)</span></div>
            <div className={`text-xl font-bold tabular-nums ${refundTotal > 0 ? "text-amber-400" : "text-white"}`}>{fmt(refundTotal)}</div>
            <div className="text-xs text-slate-600 mt-0.5">{monthRefund.length} refunds &middot; rate: {refundRate.toFixed(1)}% of GMV</div>
          </div>

          <div className={`border rounded-xl p-4 ${disputes.length > 0 ? "bg-rose-500/6 border-rose-500/20" : "bg-white/4 border-white/6"}`}>
            <div className="flex items-center gap-1.5 mb-2"><ShieldAlert size={12} className={disputes.length > 0 ? "text-rose-400" : "text-slate-500"} /><span className="text-xs text-slate-500">Open Disputes / Chargebacks</span></div>
            <div className={`text-xl font-bold tabular-nums ${disputes.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>{disputes.length}</div>
            <div className="text-xs text-slate-600 mt-0.5">{disputes.length === 0 ? "All clear" : "Requires admin review"}</div>
          </div>

          <div className={`border rounded-xl p-4 ${reconBorder}`}>
            <div className="flex items-center gap-1.5 mb-2">
              {reconStatus === "healthy" ? <CheckCircle2 size={12} className="text-emerald-400" /> : <ShieldAlert size={12} className={reconColor} />}
              <span className="text-xs text-slate-500">Reconciliation</span>
            </div>
            <div className={`text-lg font-bold uppercase ${reconColor}`}>{reconStatus}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              {latestRecon
                ? `Last run: ${new Date(latestRecon.created_at as string).toLocaleDateString("en-GB")} &middot; drift: ${fmt(commissionDrift)}`
                : `Commission drift: ${fmt(commissionDrift)}`
              }
            </div>
          </div>
        </div>

        {/* ── Financial Ledger Summary ──────────────────────────────────────── */}
        <div className={`rounded-xl p-5 border ${reconBorder}`}>
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            {reconStatus === "healthy"
              ? <CheckCircle2 size={14} className="text-emerald-400" />
              : <ShieldAlert   size={14} className={reconColor} />
            }
            Revenue Reconciliation &mdash; Single Source of Truth
          </h3>

          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {[
              { label: "Payments GMV",        value: fmt(allTimeGMV),         sub: `${succeeded.length} transactions`,            color: "text-white" },
              { label: "Ledger GMV",          value: fmt(ledgerGMV),          sub: `${ledger.length} ledger entries`,             color: "text-white" },
              { label: "Expected Commission", value: fmt(expectedCommission), sub: "10% of payments GMV",                          color: "text-white" },
              { label: "Actual Commission",   value: fmt(actualCommission),   sub: "From bookings table",                         color: isReconciled ? "text-emerald-400" : "text-red-400" },
              { label: "Pending Liability",   value: fmt(pendingPayoutTotal), sub: `${pendingPayouts.length} vendor payouts due`,  color: pendingPayoutTotal > 0 ? "text-amber-400" : "text-slate-500" },
            ].map(({ label, value, sub, color }) => (
              <div key={label}>
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
                <div className="text-xs text-slate-700 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {!isReconciled && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
              <p className="text-xs text-red-300">
                Commission drift of {fmt(commissionDrift)} detected between the payments table and bookings commission records.
                Run Query 2D in <code className="text-red-400">docs/Revenue_Reconciliation_Runbook.md</code> to identify affected bookings.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/6">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Ledger entries: <span className="text-white font-medium">{ledger.length}</span></span>
              <span>Pending ledger payout: <span className="text-amber-400 font-medium">{fmt(ledgerPendingPayout)}</span></span>
              <span>Refund rate: <span className="text-white font-medium">{refundRate.toFixed(2)}%</span></span>
            </div>
            {latestRecon && (
              <span className="text-xs text-slate-600">
                Last auto-reconciliation: {new Date(latestRecon.created_at as string).toLocaleString("en-GB")}
              </span>
            )}
          </div>
        </div>

        {/* ── Webhook Health + Financial Event Log ─────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Zap size={14} className="text-brand-400" />Webhook Health (Last 24h)
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Events Processed",      value: String(webhook24h),    color: "text-white" },
                { label: "Checkouts Completed",   value: String(checkoutEvents), color: "text-emerald-400" },
                { label: "Payment Failures",      value: String(failureEvents), color: failureEvents > 0 ? "text-rose-400" : "text-slate-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white/4">
                  <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>
            {webhookEvents.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
                <span className="text-xs text-slate-400 font-mono truncate max-w-[220px]">{e.type}</span>
                <span className="text-xs text-slate-600 flex-shrink-0">
                  {new Date(e.processed_at as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {webhookEvents.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No webhook events in the last 24 hours</p>
            )}
          </div>

          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Activity size={14} className="text-brand-400" />Financial Event Log (Recent)
            </h3>
            {finEvents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No financial events yet. Events populate after the first payment.</p>
            ) : (
              <div className="space-y-1">
                {finEvents.map((e, i) => {
                  const typeColors: Record<string, string> = {
                    PAYMENT_RECEIVED: "text-emerald-400",
                    BOOKING_CONFIRMED: "text-brand-400",
                    REFUND_COMPLETED: "text-amber-400",
                    PAYMENT_FAILED: "text-red-400",
                    CHARGEBACK_RECEIVED: "text-rose-400",
                    RECONCILIATION_RUN: "text-blue-400",
                    WEBHOOK_RECEIVED: "text-slate-500",
                    PAYOUT_COMPLETED: "text-emerald-400",
                  };
                  return (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
                      <span className={`text-xs font-mono ${typeColors[e.event_type] ?? "text-slate-400"}`}>{e.event_type}</span>
                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {new Date(e.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Refund Partial Failures ──────────────────────────────────────── */}
        {refundFailures.length > 0 && (
          <div className="rounded-xl p-5 border border-orange-500/25 bg-orange-500/6">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <RotateCcw size={14} className="text-orange-400" />
              Refund Partial Failures &mdash; Stripe refund issued but secondary step(s) failed
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              The Stripe refund has been issued to the customer in each case below. These entries indicate that the
              booking payment_status, ledger, audit log, or email confirmation may not have updated correctly.
              Review each booking and manually reconcile in Stripe Dashboard if needed.
            </p>
            <div className="space-y-2">
              {refundFailures.map((f, i) => {
                const vals = f.new_values as Record<string, unknown> | null;
                const failedSteps = (vals?.failed_steps as string[] | undefined) ?? [];
                const pi = vals?.stripe_payment_intent_id as string | undefined;
                const amount = vals?.refund_amount as number | undefined;
                return (
                  <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-white/4 border border-orange-500/15 gap-4">
                    <div>
                      <div className="text-xs text-white font-mono mb-0.5">
                        Booking: {f.entity_id ?? "unknown"}
                      </div>
                      {pi && (
                        <div className="text-xs text-slate-500 font-mono">PI: {pi}</div>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {failedSteps.map((step) => (
                          <span key={step} className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 text-xs font-mono">{step}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {amount != null && (
                        <div className="text-sm font-bold text-orange-400 tabular-nums">{fmt(amount)}</div>
                      )}
                      <div className="text-xs text-slate-600 mt-0.5">
                        {new Date(f.created_at as string).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Subscription Breakdown ────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <ArrowUpRight size={14} className="text-brand-400" />Subscription Revenue
            </h3>
            <div className="space-y-2 mb-4">
              {[
                { slug: "elite",    label: "Elite",          price: 149, color: "text-gold-400",  bg: "bg-gold-500/10" },
                { slug: "premium",  label: "Premium",        price: 79,  color: "text-brand-400", bg: "bg-brand-500/10" },
                { slug: "featured", label: "Premium (legacy)", price: 79, color: "text-brand-400", bg: "bg-brand-500/10" },
                { slug: "pro",      label: "Pro",            price: 29,  color: "text-blue-400",  bg: "bg-blue-500/10" },
              ].map(({ slug, label, price, color, bg }) => {
                const count = activeSubs.filter((s) => s.plan === slug).length;
                if (count === 0) return null;
                return (
                  <div key={slug} className={`flex items-center justify-between p-3 rounded-xl ${bg} border border-white/5`}>
                    <div>
                      <span className={`text-sm font-semibold ${color}`}>{label}</span>
                      <span className="text-xs text-slate-500 ml-2">&pound;{price}/mo &times; {count}</span>
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums">{fmt(price * count)}/mo</span>
                  </div>
                );
              })}
              {activeSubs.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No active subscriptions yet</p>
              )}
            </div>
            {pastDueSubs.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 mb-3">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle size={11} />
                  <span className="font-semibold">{pastDueSubs.length} past due</span>
                  <span className="text-slate-500">&middot; {fmt(atRiskMRR)}/mo at risk</span>
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-white/6 flex items-center justify-between">
              <span className="text-xs text-slate-500">Total MRR</span>
              <span className="text-base font-bold text-white tabular-nums">{fmt(mrr)}</span>
            </div>
          </div>

          {/* Recent payment activity */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CreditCard size={14} className="text-slate-400" />Recent Payments
              </h3>
              <Link href="/admin/payouts" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                All<ChevronRight size={11} />
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No payment activity yet</p>
            ) : (
              <div className="space-y-1.5">
                {recentPayments.map((p) => {
                  const isRef     = p.type === "refund";
                  const isFailed  = p.status === "failed";
                  const label     = isFailed ? "Failed" : isRef ? "Refund" : p.type === "deposit" ? "Deposit" : "Full";
                  const amtColor  = isFailed ? "text-slate-600 line-through" : isRef ? "text-amber-400" : "text-white";
                  const dotColor  = isFailed ? "bg-red-500/10"   : isRef ? "bg-amber-500/10" : "bg-emerald-500/10";
                  const iconColor = isFailed ? "text-red-400"    : isRef ? "text-amber-400"  : "text-emerald-400";
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dotColor}`}>
                          {isFailed ? <Ban size={11} className={iconColor} /> : isRef ? <RotateCcw size={11} className={iconColor} /> : <CreditCard size={11} className={iconColor} />}
                        </div>
                        <div>
                          <div className={`text-xs font-semibold ${iconColor}`}>{label}</div>
                          <div className="text-xs text-slate-600">
                            {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } as Intl.DateTimeFormatOptions)}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-bold tabular-nums ${amtColor}`}>
                        {isRef ? "-" : ""}{fmt(Number(p.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Finance Actions ─────────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Finance Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/admin/payouts",       icon: Wallet,       label: "Process Payouts",    badge: pendingPayouts.length },
              { href: "/admin/subscriptions",  icon: ArrowUpRight, label: "Subscriptions",      badge: pastDueSubs.length },
              { href: "/admin/disputes",       icon: ShieldAlert,  label: "Open Disputes",      badge: disputes.length },
              { href: "/admin/monetization",   icon: BarChart2,    label: "Monetization",       badge: 0 },
            ].map(({ href, icon: Icon, label, badge }) => (
              <Link key={href} href={href} className="bg-white/4 border border-white/6 rounded-xl p-4 text-center hover:border-white/10 transition-colors relative group">
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">{badge}</span>
                )}
                <Icon size={18} className="mx-auto mb-2 text-slate-400 group-hover:text-white transition-colors" />
                <div className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{label}</div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
