import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { Profile } from "@/types";
import {
  AlertCircle, CheckCircle2, Clock, Scale, Shield, Wallet,
  ArrowRight, ChevronRight, TrendingUp, CreditCard, Calendar,
  Users, RefreshCw, MessageSquare, Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";


type ActionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  urgent: boolean;
  icon: React.ElementType;
  iconColor: string;
  description: string;
  action: string;
};

export default async function OperationsPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    pendingPayoutsRes,
    pendingVendorsRes,
    pendingVerifsRes,
    openDisputesRes,
    todayBookingsRes,
    weekBookingsRes,
    monthBookingsRes,
    pendingPaymentBookingsRes,
    recentRefundsRes,
    unmoderatedReviewsRes,
  ] = await Promise.all([
    db.from("vendor_payouts")
      .select("id, amount, created_at, vendor:vendors(business_name)", { count: "exact" })
      .in("status", ["scheduled", "pending"])
      .order("created_at", { ascending: true })
      .limit(5),
    db.from("vendors")
      .select("id, business_name, category, city, created_at", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(5),
    db.from("vendor_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db.from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "disputed"),
    db.from("bookings")
      .select("id, total_amount, commission_amount, status", { count: "exact" })
      .gte("created_at", todayStart.toISOString()),
    db.from("bookings")
      .select("total_amount, commission_amount")
      .gte("created_at", weekStart.toISOString()),
    db.from("bookings")
      .select("total_amount, commission_amount")
      .gte("created_at", monthStart.toISOString()),
    db.from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    db.from("bookings")
      .select("id, total_amount, created_at, customer:profiles!bookings_customer_id_fkey(full_name)")
      .eq("payment_status", "refunded")
      .gte("created_at", weekStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "flagged"),
  ]);

  const pendingPayoutCount   = pendingPayoutsRes.count ?? 0;
  const pendingVendorCount   = pendingVendorsRes.count ?? 0;
  const pendingVerifCount    = pendingVerifsRes.count ?? 0;
  const openDisputeCount     = openDisputesRes.count ?? 0;
  const todayBookingCount    = todayBookingsRes.count ?? 0;
  const pendingPaymentCount  = pendingPaymentBookingsRes.count ?? 0;
  const flaggedReviewCount   = unmoderatedReviewsRes.count ?? 0;

  const pendingPayouts     = pendingPayoutsRes.data ?? [];
  const pendingVendors     = pendingVendorsRes.data ?? [];
  const recentRefunds      = recentRefundsRes.data ?? [];

  const weekRevenue  = (weekBookingsRes.data ?? []).reduce((s, b) => s + Number(b.commission_amount ?? 0), 0);
  const monthRevenue = (monthBookingsRes.data ?? []).reduce((s, b) => s + Number(b.commission_amount ?? 0), 0);
  const weekGMV      = (weekBookingsRes.data ?? []).reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
  const todayBookings = todayBookingsRes.data ?? [];
  const todayGMV     = todayBookings.reduce((s, b) => s + Number(b.total_amount ?? 0), 0);

  const actions: ActionItem[] = [
    {
      id: "payouts",
      label: "Vendor payouts due",
      count: pendingPayoutCount,
      href: "/admin/payouts",
      urgent: pendingPayoutCount > 0,
      icon: Wallet,
      iconColor: "text-amber-400",
      description: "Process within 7 working days of event completion",
      action: "Pay now",
    },
    {
      id: "vendors",
      label: "Vendor applications",
      count: pendingVendorCount,
      href: "/admin/vendors?status=pending",
      urgent: pendingVendorCount > 0,
      icon: Users,
      iconColor: "text-blue-400",
      description: "Review and approve within 2 working days",
      action: "Review",
    },
    {
      id: "verifications",
      label: "Verifications pending",
      count: pendingVerifCount,
      href: "/admin/verifications",
      urgent: pendingVerifCount > 0,
      icon: Shield,
      iconColor: "text-sky-400",
      description: "Identity and business verification requests",
      action: "Verify",
    },
    {
      id: "disputes",
      label: "Open disputes",
      count: openDisputeCount,
      href: "/admin/disputes",
      urgent: openDisputeCount > 0,
      icon: Scale,
      iconColor: "text-red-400",
      description: "Active dispute cases requiring resolution",
      action: "Resolve",
    },
    {
      id: "pending_payment",
      label: "Awaiting customer payment",
      count: pendingPaymentCount,
      href: "/admin/bookings",
      urgent: false,
      icon: CreditCard,
      iconColor: "text-slate-400",
      description: "Bookings accepted but deposit not yet paid",
      action: "View",
    },
    {
      id: "reviews",
      label: "Reviews flagged for moderation",
      count: flaggedReviewCount,
      href: "/admin/reviews",
      urgent: flaggedReviewCount > 0,
      icon: MessageSquare,
      iconColor: "text-orange-400",
      description: "Reported or suspicious reviews needing a decision",
      action: "Moderate",
    },
  ];

  const allClear = actions.filter((a) => a.urgent).length === 0;

  const adminProfile: Profile = {
    id: auth.user.id,
    email: auth.user.email ?? "",
    role: "admin",
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    phone_verified: profile?.phone_verified ?? false,
    avatar_url: profile?.avatar_url ?? null,
    created_at: profile?.created_at ?? now.toISOString(),
  };

  return (
    <DashboardLayout user={adminProfile} adminRole={auth.role}>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Founder Operations</h1>
            <p className="text-slate-400 text-sm mt-1">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}Today&apos;s bookings: <span className="text-white font-semibold">{todayBookingCount}</span>
              {todayGMV > 0 && <> · GMV: <span className="text-emerald-400 font-semibold">£{todayGMV.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span></>}
            </p>
          </div>
          <Link href="/admin" className="btn-secondary text-sm py-2">
            ← Command Centre
          </Link>
        </div>

        {/* All-clear banner or urgent count */}
        {allClear ? (
          <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">All clear</p>
              <p className="text-xs text-slate-500 mt-0.5">No urgent actions required. Check back after the next cron run.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {actions.filter((a) => a.urgent).length} items need your attention
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Items highlighted in amber below require action today.
              </p>
            </div>
          </div>
        )}

        {/* Action checklist */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Action Queue</h2>
          <div className="space-y-2">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-white/12 ${
                    item.urgent
                      ? "bg-amber-500/6 border-amber-500/20 hover:bg-amber-500/10"
                      : item.count === 0
                      ? "bg-white/2 border-white/4 opacity-60"
                      : "bg-white/4 border-white/8"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.urgent ? "bg-amber-500/15" : "bg-white/6"}`}>
                    <Icon size={16} className={item.urgent ? "text-amber-400" : item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${item.urgent ? "text-white" : item.count === 0 ? "text-slate-500" : "text-white"}`}>
                        {item.label}
                      </p>
                      {item.urgent && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full">
                          Action needed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`text-2xl font-bold tabular-nums ${item.urgent ? "text-amber-400" : item.count === 0 ? "text-slate-700" : "text-slate-300"}`}>
                      {item.count}
                    </div>
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                      item.urgent
                        ? "bg-amber-500/15 border-amber-500/25 text-amber-300"
                        : "bg-white/5 border-white/8 text-slate-500"
                    }`}>
                      {item.action} <ChevronRight size={10} className="inline" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Today's revenue snapshot */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Revenue Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Today: GMV",
                value: `£${todayGMV.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
                sub: `${todayBookingCount} booking${todayBookingCount === 1 ? "" : "s"}`,
                icon: Calendar,
                color: "text-slate-300",
              },
              {
                label: "This Week: Revenue",
                value: `£${weekRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
                sub: "Platform commission",
                icon: TrendingUp,
                color: "text-emerald-400",
              },
              {
                label: "This Week: GMV",
                value: `£${weekGMV.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
                sub: "Gross booking value",
                icon: Activity,
                color: "text-slate-400",
              },
              {
                label: "This Month: Revenue",
                value: `£${monthRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
                sub: "Platform commission",
                icon: CreditCard,
                color: "text-brand-400",
              },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={12} className={color} />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending payouts detail */}
        {pendingPayouts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Wallet size={11} className="text-amber-400" />
                Payouts due: next up
              </h2>
              <Link href="/admin/payouts" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {pendingPayouts.map((p) => {
                const vendor = p.vendor as unknown as Record<string, string> | null;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3.5 bg-white/3 border border-amber-500/15 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-white">{vendor?.business_name ?? "Unknown vendor"}</p>
                      <p className="text-xs text-slate-500">
                        Scheduled {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">
                        £{Number(p.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">due now</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending vendor applications detail */}
        {pendingVendors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Users size={11} className="text-blue-400" />
                Vendor applications: oldest first
              </h2>
              <Link href="/admin/vendors?status=pending" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                Review all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {pendingVendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3.5 bg-white/3 border border-white/8 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-white">{v.business_name}</p>
                    <p className="text-xs text-slate-500">
                      {String(v.category).replace(/_/g, " ")} · {v.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Applied</p>
                    <p className="text-xs text-white">
                      {new Date(v.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent refunds */}
        {recentRefunds.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <RefreshCw size={11} className="text-slate-400" />
                Refunds processed this week
              </h2>
              <Link href="/admin/bookings" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                All bookings <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {recentRefunds.map((b) => {
                const customer = b.customer as unknown as Record<string, string> | null;
                return (
                  <div key={b.id} className="flex items-center justify-between p-3.5 bg-white/3 border border-white/8 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-white">{customer?.full_name ?? "Unknown customer"}</p>
                      <p className="text-xs text-slate-500">Booking {b.id.slice(0, 8)}…</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-400">
                        £{Number(b.total_amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">refunded</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { href: "/admin/payouts",               label: "Payout Queue",       icon: Wallet,       badge: pendingPayoutCount > 0 ? pendingPayoutCount : null },
              { href: "/admin/disputes",               label: "Open Disputes",      icon: Scale,        badge: openDisputeCount > 0 ? openDisputeCount : null },
              { href: "/admin/vendors?status=pending", label: "Pending Approvals",  icon: Users,        badge: pendingVendorCount > 0 ? pendingVendorCount : null },
              { href: "/admin/verifications",          label: "Verifications",      icon: Shield,       badge: pendingVerifCount > 0 ? pendingVerifCount : null },
              { href: "/admin/reviews",                label: "Review Moderation",  icon: MessageSquare,badge: flaggedReviewCount > 0 ? flaggedReviewCount : null },
              { href: "/admin/bookings",               label: "All Bookings",       icon: Calendar,     badge: null },
              { href: "/admin/support",                label: "Support Tooling",    icon: Activity,     badge: null },
              { href: "/admin",                        label: "Command Centre",     icon: TrendingUp,   badge: null },
            ].map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-3 p-3.5 bg-white/4 border border-white/6 rounded-xl hover:border-white/12 hover:bg-white/6 transition-colors"
              >
                {badge !== null && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center z-10">
                    {badge}
                  </span>
                )}
                <Icon size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-300">{label}</span>
                <ChevronRight size={12} className="text-slate-600 ml-auto flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
