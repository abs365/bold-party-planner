import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Lock, Unlock, CheckCircle2, Circle, AlertTriangle, ArrowRight,
  Users, ShoppingBag, CreditCard, Shield, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

// ── Data ──────────────────────────────────────────────────────────────────────

async function fetchFreezeMetrics() {
  const db = await createAdminClient();

  const [
    { count: approvedVendors },
    { count: quoteRequests },
    { count: completedBookings },
    { count: confirmedBookings },
    { count: payoutsCompleted },
    { count: verifiedReviews },
    { count: successfulRefunds },
    { count: resolvedDisputes },
    { data: revenueRows },
  ] = await Promise.all([
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "approved"),
    db.from("quotes").select("*", { count: "exact", head: true }),
    db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
    db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    db.from("vendor_payouts").select("*", { count: "exact", head: true }).eq("status", "paid"),
    db.from("reviews").select("*", { count: "exact", head: true }).eq("is_verified", true),
    db.from("payments").select("*", { count: "exact", head: true }).eq("type", "refund").eq("status", "succeeded"),
    db.from("disputes").select("*", { count: "exact", head: true }).in("status", ["resolved", "closed"]),
    db.from("payments").select("amount").eq("status", "succeeded").neq("type", "refund"),
  ]);

  const totalBookings = (completedBookings ?? 0) + (confirmedBookings ?? 0);
  const revenueTotal = (revenueRows ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return {
    vendors: approvedVendors ?? 0,
    quotes: quoteRequests ?? 0,
    completedBookings: totalBookings,
    payouts: payoutsCompleted ?? 0,
    verifiedReviews: verifiedReviews ?? 0,
    successfulRefunds: successfulRefunds ?? 0,
    resolvedDisputes: resolvedDisputes ?? 0,
    revenue: revenueTotal,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = "bg-amber-400" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, max === 0 ? 0 : Math.round((value / max) * 100));
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-400" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Gate({
  index, label, current, target, unlocked,
}: { index: number; label: string; current: number; target: number; unlocked: boolean }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      unlocked
        ? "border-emerald-500/30 bg-emerald-500/6"
        : "border-white/8 bg-white/3"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
          unlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 text-slate-500"
        }`}>
          {unlocked ? <CheckCircle2 size={14} className="text-emerald-400" /> : index}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium mb-1.5 ${unlocked ? "text-emerald-300" : "text-slate-300"}`}>
            {label}
          </div>
          <ProgressBar value={current} max={target} color="bg-amber-400" />
          <div className={`text-xs mt-1.5 font-light ${unlocked ? "text-emerald-500" : "text-slate-600"}`}>
            {current.toLocaleString()} / {target.toLocaleString()}
            {unlocked && " (cleared)"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Milestone({
  label, current, target, unlocked, prefix = "",
}: { label: string; current: number; target: number; unlocked: boolean; prefix?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/4 last:border-0">
      {unlocked
        ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
        : <Circle size={14} className="text-slate-700 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-light ${unlocked ? "text-slate-400 line-through" : "text-slate-300"}`}>
          {label}
        </div>
        {!unlocked && target > 1 && (
          <div className="mt-1">
            <ProgressBar value={current} max={target} color="bg-indigo-400" />
          </div>
        )}
      </div>
      <div className={`text-xs font-light flex-shrink-0 ${unlocked ? "text-emerald-500" : "text-slate-600"}`}>
        {prefix}{current.toLocaleString()} / {prefix}{target.toLocaleString()}
      </div>
    </div>
  );
}

function FirstMilestone({ label, achieved }: { label: string; achieved: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/4 last:border-0">
      {achieved
        ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
        : <Circle size={14} className="text-slate-700 flex-shrink-0" />}
      <span className={`text-sm font-light flex-1 ${achieved ? "text-slate-400 line-through" : "text-slate-300"}`}>
        {label}
      </span>
      <span className={`text-xs font-light ${achieved ? "text-emerald-500" : "text-slate-700"}`}>
        {achieved ? "Done" : "Pending"}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LaunchFreezePage() {
  const auth = await requireAdminRole("founder");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const m = await fetchFreezeMetrics();

  const gate1 = m.vendors >= 20;
  const gate2 = m.quotes >= 20;
  const gate3 = m.completedBookings >= 10;
  const gate4 = m.payouts >= 1;
  const gatesCleared = [gate1, gate2, gate3, gate4].filter(Boolean).length;
  const allGatesCleared = gatesCleared === 4;

  const vendorProfileUser = (profile ?? {
    id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  return (
    <DashboardLayout user={vendorProfileUser} adminRole={auth.role}>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {allGatesCleared
                ? <Unlock size={18} className="text-emerald-400" />
                : <Lock size={18} className="text-amber-400" />}
              Phase 1 Launch Freeze
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-light">
              Feature development is frozen until the unlock gate is cleared
            </p>
          </div>
          <Link
            href="/docs/Phase1_Launch_Freeze.md"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-slate-400 text-xs hover:text-white transition-colors"
          >
            Policy doc <ArrowRight size={11} />
          </Link>
        </div>

        {/* Status banner */}
        <div className={`rounded-xl border px-5 py-5 ${
          allGatesCleared
            ? "border-emerald-500/40 bg-emerald-500/8"
            : "border-amber-500/30 bg-amber-500/6"
        }`}>
          <div className="flex items-center gap-3 mb-1">
            {allGatesCleared
              ? <Unlock size={18} className="text-emerald-400" />
              : <Lock size={18} className="text-amber-400" />}
            <span className={`text-lg font-bold ${allGatesCleared ? "text-emerald-300" : "text-amber-300"}`}>
              {allGatesCleared
                ? "Unlock Gate Cleared: Phase 2 Features Permitted"
                : `Freeze Active: ${gatesCleared} of 4 gates cleared`}
            </span>
          </div>
          <p className={`text-sm font-light ml-9 ${allGatesCleared ? "text-emerald-500" : "text-amber-600"}`}>
            {allGatesCleared
              ? "All four unlock conditions are met. Phase 2 feature planning can begin. Confirm one complete end-to-end loop before scheduling sprint work."
              : "No new major features. Focus: vendor acquisition, customer acquisition, operational excellence, trust, revenue, feedback."}
          </p>
        </div>

        {/* ── UNLOCK GATE ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Unlock Gate ({gatesCleared}/4)
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Gate index={1} label="20 real approved vendors"         current={m.vendors}           target={20} unlocked={gate1} />
            <Gate index={2} label="20 real customer quote requests"  current={m.quotes}            target={20} unlocked={gate2} />
            <Gate index={3} label="10 completed bookings"            current={m.completedBookings} target={10} unlocked={gate3} />
            <Gate index={4} label="First vendor payout completed"    current={m.payouts}           target={1}  unlocked={gate4} />
          </div>
        </div>

        {/* ── VENDOR MILESTONES ───────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Vendor Milestones</h2>
          </div>
          <Milestone label="20 approved vendors" current={m.vendors} target={20} unlocked={m.vendors >= 20} />
          <Milestone label="50 approved vendors" current={m.vendors} target={50} unlocked={m.vendors >= 50} />
        </div>

        {/* ── CUSTOMER MILESTONES ─────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer Milestones</h2>
          </div>
          <Milestone label="20 quote requests"    current={m.quotes}            target={20} unlocked={m.quotes >= 20} />
          <Milestone label="10 bookings"          current={m.completedBookings} target={10} unlocked={m.completedBookings >= 10} />
          <Milestone label="20 bookings"          current={m.completedBookings} target={20} unlocked={m.completedBookings >= 20} />
        </div>

        {/* ── REVENUE MILESTONES ──────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Revenue Milestones &mdash; £{m.revenue.toFixed(2)} gross to date
            </h2>
          </div>
          <Milestone label="First £100 gross revenue"    current={m.revenue} target={100}  unlocked={m.revenue >= 100}  prefix="£" />
          <Milestone label="First £1,000 gross revenue"  current={m.revenue} target={1000} unlocked={m.revenue >= 1000} prefix="£" />
          <Milestone label="First £5,000 gross revenue"  current={m.revenue} target={5000} unlocked={m.revenue >= 5000} prefix="£" />
        </div>

        {/* ── TRUST MILESTONES ────────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Trust Milestones</h2>
          </div>
          <FirstMilestone label="First verified customer review"  achieved={m.verifiedReviews >= 1} />
          <FirstMilestone label="First vendor payout completed"   achieved={m.payouts >= 1} />
          <FirstMilestone label="First successful refund processed" achieved={m.successfulRefunds >= 1} />
          <FirstMilestone label="First dispute resolved"          achieved={m.resolvedDisputes >= 1} />
        </div>

        {/* ── EXCEPTIONS ──────────────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Always Permitted</h2>
          </div>
          <p className="text-xs text-slate-600 font-light mb-3">
            These are never blocked by the freeze:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Critical bugs: any broken user journey",
              "Security fixes: auth, data exposure, injection",
              "Trust issues: badge integrity, escrow language",
              "Payment issues: incorrect money movement",
              "Compliance: legal, FCA-adjacent, GDPR, PCI",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-slate-400 font-light">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── FOCUS AREAS ─────────────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Phase 1 Focus Areas</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              ["Vendor acquisition", "/admin/pilot/outreach"],
              ["Customer acquisition", "/admin/analytics"],
              ["Operational excellence", "/admin/launch"],
              ["Trust & verification", "/admin/verifications"],
              ["Revenue & payouts", "/admin/finance"],
              ["Feedback & learning", "/admin/feedback"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 text-xs text-slate-400 font-light hover:text-slate-200 transition-colors py-1"
              >
                <ArrowRight size={10} className="text-amber-400 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-slate-700 text-xs text-center">
          All metrics are live from the database. Refresh the page to update.
        </p>
      </div>
    </DashboardLayout>
  );
}
