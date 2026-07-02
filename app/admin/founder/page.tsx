import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import { computeCommercialMetrics } from "@/lib/vendor/commercial-metrics";
import {
  CheckCircle2, Clock, Users, MessageSquare, ShoppingBag,
  CreditCard, TrendingUp, Target, ArrowRight, Shield,
  Star, AlertCircle, ChevronRight, DollarSign, TrendingDown, UserCheck,
  Sunrise, Sparkles,
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
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "approved"),
    db.from("vendors").select("*", { count: "exact", head: true }).gte("verification_level", 2),
    db.from("quotes").select("*", { count: "exact", head: true }),
    db.from("quotes").select("*", { count: "exact", head: true }).in("status", ["responded", "viewed", "shortlisted", "accepted", "converted"]),
    db.from("bookings").select("*", { count: "exact", head: true }),
    db.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
    db.from("payments").select("amount, commission_amount").eq("status", "succeeded").neq("type", "refund"),
    db.from("reviews").select("*", { count: "exact", head: true }),
  ]);

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
    db.from("vendors").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
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
            { href: "/admin/pilot/vendors",          label: "Pilot CRM",        badge: null },
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
                  Use the Pilot CRM to track outreach and the vendor activation funnel to monitor quality.
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
