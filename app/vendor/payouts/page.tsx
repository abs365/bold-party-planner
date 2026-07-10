import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle,
  CreditCard, RotateCcw, ShieldCheck, ChevronRight,
} from "lucide-react";
import { BankDetailsForm } from "@/components/vendor/BankDetailsForm";
import { StripeConnectCard } from "@/components/vendor/StripeConnectCard";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

export default async function VendorPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; refresh?: string }>;
}) {
  const { connected } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id, business_name").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/onboarding");

  const adminDb = await createAdminClient();

  // Parallel queries
  const [bookingsRes, payoutsRes, ledgerRes, bankRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, total_amount, deposit_amount, commission_amount, vendor_payout, status, payment_status, created_at, event:events(title, date)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(50),

    adminDb
      .from("vendor_payouts")
      .select("id, amount, status, created_at, booking_id, notes")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),

    adminDb
      .from("financial_ledger")
      .select("booking_id, gross_amount, platform_commission_amount, vendor_amount, refund_amount, payment_status, payout_status, created_at")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),

    adminDb
      .from("vendor_bank_details")
      .select("account_name, sort_code, account_number")
      .eq("vendor_id", vendor.id)
      .maybeSingle(),
  ]);

  const bookings   = bookingsRes.data   ?? [];
  const payouts    = payoutsRes.data    ?? [];
  const ledger     = ledgerRes.data     ?? [];
  const bankDetails = bankRes.data      ?? null;

  // Build ledger and payout lookup maps keyed by booking_id
  const ledgerByBooking = Object.fromEntries(ledger.map((l) => [l.booking_id, l]));
  const payoutByBooking = Object.fromEntries(payouts.map((p) => [p.booking_id, p]));

  // Aggregate totals
  const confirmed   = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalGross  = confirmed.reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
  const totalEarned = confirmed.reduce((s, b) => {
    const l = ledgerByBooking[b.id];
    return s + (l ? Number(l.vendor_amount) : Number(b.vendor_payout ?? 0) || Number(b.total_amount ?? 0) * 0.9);
  }, 0);
  const totalCommission = totalGross - totalEarned;

  const paidOut       = payouts.filter((p) => p.status === "paid");
  const pendingPayout = payouts.filter((p) => p.status === "pending");
  const paidOutTotal  = paidOut.reduce((s, p) => s + Number(p.amount), 0);
  const pendingTotal  = pendingPayout.reduce((s, p) => s + Number(p.amount), 0);

  // Enriched booking rows
  type EnrichedBooking = {
    id: string;
    status: string;
    paymentStatus: string | null;
    eventTitle: string;
    eventDate: string | null;
    gross: number;
    commission: number;
    vendorShare: number;
    refundAmount: number;
    payoutStatus: string;
    payoutDate: string | null;
    payoutId: string | null;
    source: "ledger" | "booking";
  };

  const enriched: EnrichedBooking[] = bookings.map((b) => {
    const l = ledgerByBooking[b.id];
    const p = payoutByBooking[b.id];

    const gross      = l ? Number(l.gross_amount)                : Number(b.total_amount ?? 0);
    const commission = l ? Number(l.platform_commission_amount)  : Number(b.commission_amount ?? gross * 0.10);
    const vendor     = l ? Number(l.vendor_amount)               : Number(b.vendor_payout ?? gross * 0.90);
    const refund     = l ? Number(l.refund_amount)               : 0;
    const payoutSt   = p?.status ?? l?.payout_status ?? "not_due";

    return {
      id:            b.id,
      status:        b.status,
      paymentStatus: l?.payment_status ?? b.payment_status ?? null,
      eventTitle:    (b.event as { title?: string; date?: string } | null)?.title ?? "Untitled Event",
      eventDate:     (b.event as { title?: string; date?: string } | null)?.date ?? null,
      gross,
      commission,
      vendorShare:   vendor,
      refundAmount:  refund,
      payoutStatus:  payoutSt,
      payoutDate:    p?.created_at ?? null,
      payoutId:      p?.id ?? null,
      source:        l ? "ledger" : "booking",
    };
  });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue &amp; Payouts</h1>
          <p className="text-slate-400 text-sm mt-1">Your earnings, commission breakdown, and payout history</p>
        </div>

        {/* ── Secure Business Verification (Stripe Connect) ────────────────── */}
        <StripeConnectCard justConnected={connected === "1"} />

        {/* ── Summary Cards ────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Gross Revenue",  value: fmt(totalGross),       icon: TrendingUp,  color: "text-white",       bg: "bg-white/4 border-white/6" },
            { label: "Your Earnings (90%)",  value: fmt(totalEarned),      icon: Wallet,      color: "text-emerald-400", bg: "bg-emerald-500/6 border-emerald-500/15" },
            { label: "Paid Out to You",       value: fmt(paidOutTotal),     icon: CheckCircle2, color: "text-brand-400", bg: "bg-brand-500/6 border-brand-500/15" },
            { label: "Pending Payout",        value: fmt(pendingTotal),     icon: Clock,       color: "text-amber-400",   bg: pendingTotal > 0 ? "bg-amber-500/6 border-amber-500/15" : "bg-white/4 border-white/6" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`border rounded-xl p-4 ${bg}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} className={color} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
              <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Commission Transparency Panel ─────────────────────────────────── */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white mb-1">Commission Structure</h2>
              <p className="text-xs text-slate-400 mb-4">Elbold operates on a transparent 90/10 split. Here is the exact breakdown across your confirmed bookings.</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-white/4 border border-white/6">
                  <div className="text-base font-bold text-white tabular-nums">{fmt(totalGross)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Customer paid</div>
                  <div className="text-xs text-slate-600 mt-0.5">Gross booking value</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-500/6 border border-red-500/15">
                  <div className="text-base font-bold text-red-400 tabular-nums">{fmt(totalCommission)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Elbold fee (10%)</div>
                  <div className="text-xs text-slate-600 mt-0.5">Platform commission</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/6 border border-emerald-500/15">
                  <div className="text-base font-bold text-emerald-400 tabular-nums">{fmt(totalEarned)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Your earnings (90%)</div>
                  <div className="text-xs text-slate-600 mt-0.5">Net to you</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Per-Booking Commission Breakdown ─────────────────────────────── */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-bold text-white mb-1">Booking Revenue Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">Every row shows exactly what the customer paid, Elbold&apos;s 10% fee, and your 90% share.</p>

          {enriched.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={28} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No bookings yet. Revenue will appear here once customers book your services.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_100px_80px] gap-2 px-3 py-1">
                {["Booking", "Gross", "Fee (10%)", "Your 90%", "Payout Status", ""].map((h) => (
                  <div key={h} className="text-xs font-medium text-slate-600 text-right first:text-left">{h}</div>
                ))}
              </div>

              {enriched.map((b) => {
                const payoutStatusConfig: Record<string, { label: string; color: string }> = {
                  not_due:   { label: "Not due",  color: "text-slate-500" },
                  scheduled: { label: "Scheduled", color: "text-blue-400"  },
                  pending:   { label: "Pending",   color: "text-amber-400" },
                  paid:      { label: "Paid",      color: "text-emerald-400" },
                  failed:    { label: "Failed",    color: "text-red-400"   },
                };
                const paymentStatusConfig: Record<string, { label: string; color: string }> = {
                  deposit_paid:       { label: "Deposit paid",  color: "text-amber-400" },
                  fully_paid:         { label: "Fully paid",    color: "text-emerald-400" },
                  pending:            { label: "Pending",       color: "text-slate-500" },
                  refunded:           { label: "Refunded",      color: "text-red-400" },
                  partially_refunded: { label: "Part refunded", color: "text-amber-400" },
                  paid:               { label: "Paid",          color: "text-emerald-400" },
                };
                const ps = payoutStatusConfig[b.payoutStatus] ?? { label: b.payoutStatus, color: "text-slate-400" };
                const pm = paymentStatusConfig[b.paymentStatus ?? ""] ?? { label: b.paymentStatus ?? "—", color: "text-slate-500" };

                return (
                  <div key={b.id} className="sm:grid sm:grid-cols-[1fr_80px_80px_80px_100px_80px] gap-2 items-center p-3 rounded-xl bg-white/4 border border-white/5 hover:bg-white/6 transition-colors">
                    {/* Mobile: stacked layout */}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{b.eventTitle}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {b.eventDate && (
                          <span className="text-xs text-slate-500">
                            {new Date(b.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        <span className={`text-xs font-medium ${pm.color}`}>{pm.label}</span>
                        {b.refundAmount > 0 && (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <RotateCcw size={9} />{fmt(b.refundAmount)} refunded
                          </span>
                        )}
                        {b.source === "ledger" && (
                          <span className="text-xs text-slate-600">audited</span>
                        )}
                      </div>
                    </div>

                    {/* Mobile: summary row */}
                    <div className="sm:hidden flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <div className="text-xs text-slate-500">
                        Gross: <span className="text-white font-medium">{fmt(b.gross)}</span>
                        {" "}&#183; Fee: <span className="text-red-400 font-medium">{fmt(b.commission)}</span>
                        {" "}&#183; Yours: <span className="text-emerald-400 font-medium">{fmt(b.vendorShare)}</span>
                      </div>
                      <span className={`text-xs font-medium ${ps.color}`}>{ps.label}</span>
                    </div>

                    {/* Desktop: column cells */}
                    <div className="hidden sm:block text-sm font-semibold text-white tabular-nums text-right">{fmt(b.gross)}</div>
                    <div className="hidden sm:block text-sm text-red-400 tabular-nums text-right">{fmt(b.commission)}</div>
                    <div className="hidden sm:block text-sm font-bold text-emerald-400 tabular-nums text-right">{fmt(b.vendorShare)}</div>

                    <div className={`hidden sm:flex items-center justify-end gap-1 text-xs font-medium ${ps.color}`}>
                      {b.payoutStatus === "paid" && <CheckCircle2 size={10} />}
                      {b.payoutStatus === "scheduled" && <Clock size={10} />}
                      {b.payoutStatus === "pending" && <Clock size={10} />}
                      {ps.label}
                    </div>

                    <div className="hidden sm:flex justify-end">
                      {b.payoutDate && (
                        <span className="text-xs text-slate-600">
                          {new Date(b.payoutDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Payout History ────────────────────────────────────────────────── */}
        {payouts.length > 0 && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h2 className="font-bold text-white mb-4">Payout History</h2>
            <div className="space-y-2">
              {payouts.map((p) => {
                const statusMap: Record<string, { color: string; label: string }> = {
                  paid:    { color: "text-emerald-400", label: "Paid" },
                  pending: { color: "text-amber-400",   label: "Pending" },
                  failed:  { color: "text-red-400",     label: "Failed" },
                };
                const s = statusMap[p.status] ?? { color: "text-slate-400", label: p.status };
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.status === "paid" ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                        {p.status === "paid" ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Clock size={12} className="text-amber-400" />}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${s.color}`}>{s.label}</div>
                        <div className="text-xs text-slate-600">
                          {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          {p.notes && ` · ${p.notes}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-base font-bold text-white tabular-nums">{fmt(Number(p.amount))}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Bank Details ──────────────────────────────────────────────────── */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white">Payout Bank Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">Where we send your earnings after each completed booking</p>
            </div>
            {bankDetails && (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 size={10} />Details on file
              </span>
            )}
          </div>
          <BankDetailsForm initial={bankDetails ?? null} />
        </div>

        {/* ── How Payouts Work ──────────────────────────────────────────────── */}
        <div className="bg-white/4 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">How Payouts Work</h2>
            <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">Beta Period</span>
          </div>
          <div className="space-y-2.5 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <CreditCard size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <p>Elbold retains a <span className="text-white font-medium">10% platform fee</span> on each confirmed booking. You receive 90% of the booking value.</p>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <p>Payouts are processed within <span className="text-white font-medium">7 business days</span> of event completion, to the bank account registered above.</p>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <p>Every payment is individually audited. You can see the exact commission and payout per booking in the table above.</p>
            </div>
            <div className="flex items-start gap-2">
              <Wallet size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <p>Payouts are currently processed manually by our team, to the bank details you register here — this doesn&apos;t change what you&apos;re owed or when it&apos;s due, only how it&apos;s sent.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/6 flex items-center gap-1.5 text-xs text-slate-500">
            <ChevronRight size={11} />
            Automated bank payouts via Stripe Connect are planned — the bank details above will carry over, and you&apos;ll be notified before any transition.
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
