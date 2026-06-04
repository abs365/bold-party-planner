import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users, Store, CreditCard, TrendingUp, AlertCircle,
  ArrowRight, CheckCircle2, Shield, BarChart2, Eye, Clock,
  MessageSquare, ChevronRight, Bell, Rocket, Activity,
  DollarSign, ShoppingBag, Inbox, Scale, Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Redirect to homepage — NOT /dashboard — to avoid the loop:
  // /admin (email mismatch) → /dashboard → (profile.role=admin) → /admin → …
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  // Service-role client bypasses RLS — admin sees all data
  const db = await createAdminClient();

  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const cutoff7  = new Date(); cutoff7.setDate(cutoff7.getDate() - 7);
  const cutoff30 = new Date(); cutoff30.setDate(cutoff30.getDate() - 30);

  const [
    customersRes,
    vendorsApprovedRes,
    vendorsTotalRes,
    vendorsPendingCountRes,
    bookingsRes,
    weeklyBookingsRes,
    pendingQuotesRes,
    disputesRes,
    pendingVerificationsRes,
    openReportsRes,
    flaggedVendorsRes,
    flaggedReviewsRes,
    alertsRes,
    pendingVendorsRes,
    phoneVerifiedRes,
    eventsRes,
    recentCustomersRes,
    recentVendorsRes,
    pilotVendorsRes,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    db.from("vendors").select("id", { count: "exact", head: true }).eq("status", "approved"),
    db.from("vendors").select("id", { count: "exact", head: true }),
    db.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("bookings").select("total_amount, commission_amount, status, created_at")
      .order("created_at", { ascending: false }).limit(200),
    db.from("bookings").select("total_amount, commission_amount, created_at")
      .gte("created_at", cutoff7.toISOString()).order("created_at", { ascending: false }),
    db.from("quotes").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("bookings").select("id", { count: "exact", head: true }).eq("status", "disputed"),
    db.from("vendor_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    db.from("vendors").select("id", { count: "exact", head: true }).eq("suspicious_flag", true),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("moderation_status", "flagged"),
    db.from("admin_alerts").select("id, type, title, body, severity, created_at, read")
      .eq("read", false).order("created_at", { ascending: false }).limit(8),
    db.from("vendors").select("id, business_name, category, city, created_at, profile:profiles(full_name, email)")
      .eq("status", "pending").order("created_at", { ascending: false }).limit(10),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").not("phone", "is", null),
    db.from("events").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id, full_name, created_at").eq("role", "customer")
      .order("created_at", { ascending: false }).limit(4),
    db.from("vendors").select("id, business_name, category, status, created_at")
      .order("created_at", { ascending: false }).limit(4),
    db.from("pilot_vendors").select("status, business_name, created_at").then((r) => r.error ? { data: [], error: null } : r),
  ]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalCustomers     = customersRes.count ?? 0;
  const approvedVendors    = vendorsApprovedRes.count ?? 0;
  const totalVendors       = vendorsTotalRes.count ?? 0;
  const pendingVendorCount = vendorsPendingCountRes.count ?? 0;
  const allBookings        = bookingsRes.data ?? [];
  const weeklyBookings     = weeklyBookingsRes.data ?? [];
  const recentAlerts       = alertsRes.data ?? [];
  const pendingVendors     = pendingVendorsRes.data ?? [];
  const recentCustomers    = recentCustomersRes.data ?? [];
  const recentVendors      = recentVendorsRes.data ?? [];
  const pilotVendors       = pilotVendorsRes.data ?? [];

  const totalRevenue    = allBookings.reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);
  const weeklyRevenue   = weeklyBookings.reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);
  const weeklyVolume    = weeklyBookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
  const monthlyBookings = allBookings.filter((b) => new Date(b.created_at) >= cutoff30);
  const monthlyRevenue  = monthlyBookings.reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);
  const recentBookings  = allBookings.slice(0, 6);
  const confirmedAll    = allBookings.filter((b) => ["confirmed", "completed"].includes(b.status)).length;
  const pendingAll      = allBookings.filter((b) => b.status === "pending").length;

  const disputeCount       = disputesRes.count ?? 0;
  const pendingVerif       = pendingVerificationsRes.count ?? 0;
  const openReports        = openReportsRes.count ?? 0;
  const flaggedVendors     = flaggedVendorsRes.count ?? 0;
  const flaggedReviews     = flaggedReviewsRes.count ?? 0;
  const pendingQuotes      = pendingQuotesRes.count ?? 0;
  const phoneVerifiedCount = phoneVerifiedRes.count ?? 0;
  const phoneVerifRate     = totalCustomers > 0 ? Math.round((phoneVerifiedCount / totalCustomers) * 100) : 0;
  const totalEvents        = eventsRes.count ?? 0;

  // Pilot KPIs — sourced from pilot_vendors CRM
  const pilotContacted = pilotVendors.filter((v) => v.status !== "prospect").length;
  const pilotApproved  = pilotVendors.filter((v) => ["approved", "verified", "active"].includes(v.status)).length;
  const pilotActive    = pilotVendors.filter((v) => v.status === "active").length;

  // Recent activity timeline — merge 3 event types, sort by time
  type ActivityItem = { icon: string; label: string; sub: string; time: string };
  const activity: ActivityItem[] = [
    ...recentCustomers.map((c) => ({
      icon: "👤",
      label: `New customer: ${(c.full_name as string | null) ?? "Unknown"}`,
      sub: "Customer signup",
      time: c.created_at as string,
    })),
    ...recentVendors.map((v) => ({
      icon: "🏪",
      label: v.business_name as string,
      sub: `Vendor ${(v.status as string) === "pending" ? "application" : "registered"} · ${(v.category as string).replace(/_/g, " ")}`,
      time: v.created_at as string,
    })),
    ...allBookings.slice(0, 4).map((b) => ({
      icon: "📋",
      label: `Booking ${b.status} — ${formatCurrency(b.total_amount)}`,
      sub: `Platform +${formatCurrency(b.commission_amount ?? 0)}`,
      time: b.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return (
    <DashboardLayout user={{ id: user.id, email: user.email ?? "", role: "admin", full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, phone_verified: profile?.phone_verified ?? false, avatar_url: profile?.avatar_url ?? null, created_at: profile?.created_at ?? new Date().toISOString() }}>
      <div data-testid="admin-dashboard" className="max-w-7xl mx-auto space-y-7">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ELBOLD Command Centre</h1>
            <p className="text-slate-400 text-sm mt-1">
              Marketplace Operations ·{" "}
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/analytics" className="btn-secondary text-sm py-2">
              <BarChart2 size={14} />Analytics
            </Link>
            <Link href="/admin/launch" className="btn-secondary text-sm py-2">
              <Rocket size={14} />Launch
            </Link>
          </div>
        </div>

        {/* ── Operations Alert Bar ────────────────────────────────────────────── */}
        {(pendingVendorCount > 0 || disputeCount > 0 || pendingVerif > 0 || openReports > 0
          || flaggedVendors > 0 || flaggedReviews > 0 || recentAlerts.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {pendingVendorCount > 0 && (
              <Link href="/admin/vendors?status=pending" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs hover:bg-amber-500/15 transition-colors">
                <AlertCircle size={13} /><span className="font-semibold">{pendingVendorCount}</span> pending approvals<ChevronRight size={12} />
              </Link>
            )}
            {disputeCount > 0 && (
              <Link href="/admin/disputes" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs hover:bg-red-500/15 transition-colors">
                <Scale size={13} /><span className="font-semibold">{disputeCount}</span> open disputes<ChevronRight size={12} />
              </Link>
            )}
            {pendingVerif > 0 && (
              <Link href="/admin/verifications" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs hover:bg-blue-500/15 transition-colors">
                <Shield size={13} /><span className="font-semibold">{pendingVerif}</span> verifications pending<ChevronRight size={12} />
              </Link>
            )}
            {flaggedVendors > 0 && (
              <Link href="/admin/governance" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs hover:bg-red-500/15 transition-colors">
                <AlertCircle size={13} /><span className="font-semibold">{flaggedVendors}</span> flagged vendors<ChevronRight size={12} />
              </Link>
            )}
            {openReports > 0 && (
              <Link href="/admin/moderation" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs hover:bg-rose-500/15 transition-colors">
                <Eye size={13} /><span className="font-semibold">{openReports}</span> content reports<ChevronRight size={12} />
              </Link>
            )}
            {flaggedReviews > 0 && (
              <Link href="/admin/reviews" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs hover:bg-orange-500/15 transition-colors">
                <AlertCircle size={13} /><span className="font-semibold">{flaggedReviews}</span> reviews flagged<ChevronRight size={12} />
              </Link>
            )}
            {recentAlerts.length > 0 && (
              <Link href="/admin/system" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-500/10 border border-brand-500/25 text-brand-400 text-xs hover:bg-brand-500/15 transition-colors">
                <Bell size={13} /><span className="font-semibold">{recentAlerts.length}</span> system alerts<ChevronRight size={12} />
              </Link>
            )}
          </div>
        )}

        {/* ── Core Platform KPIs ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Core Platform KPIs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Customers",     value: totalCustomers,              icon: Users,        color: "text-blue-400",    href: "/admin/customers" },
              { label: "Total Vendors",       value: totalVendors,                icon: Store,        color: "text-slate-400",   href: "/admin/vendors" },
              { label: "Approved Vendors",    value: approvedVendors,             icon: CheckCircle2, color: "text-brand-400",   href: "/admin/vendors?status=approved" },
              { label: "Pending Applications",value: pendingVendorCount,          icon: Clock,        color: pendingVendorCount > 0 ? "text-amber-400" : "text-slate-500", href: "/admin/vendors?status=pending" },
              { label: "Total Bookings",      value: allBookings.length,          icon: ShoppingBag,  color: "text-purple-400",  href: "/admin/bookings" },
              { label: "Platform Revenue",    value: formatCurrency(totalRevenue),icon: CreditCard,   color: "text-gold-400",    href: "/admin/payouts" },
              { label: "Pending Quotes",      value: pendingQuotes,               icon: Inbox,        color: pendingQuotes > 0 ? "text-sky-400" : "text-slate-500",  href: "/admin/quotes" },
              { label: "Open Disputes",       value: disputeCount,                icon: Scale,        color: disputeCount > 0 ? "text-red-400" : "text-emerald-400", href: "/admin/disputes" },
              { label: "Confirmed Bookings",  value: confirmedAll,                icon: Wallet,       color: "text-emerald-400", href: "/admin/bookings" },
              { label: "Phone Verified",      value: `${phoneVerifRate}%`,        icon: Shield,       color: "text-teal-400",    href: "/admin/verifications" },
            ].map(({ label, value, icon: Icon, color, href }) => (
              <Link key={label} href={href} className="bg-white/4 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 leading-tight">{label}</span>
                  <Icon size={14} className={color} />
                </div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-700 mt-0.5 group-hover:text-slate-500 transition-colors flex items-center gap-0.5">
                  View <ChevronRight size={9} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Pilot Launch KPIs ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Rocket size={11} className="text-brand-400" />Pilot Launch KPIs
            </h2>
            <Link href="/admin/pilot" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              Pilot Ops <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Vendors Contacted",  value: String(pilotContacted), note: `of ${pilotVendors.length} tracked`, color: "text-blue-400",    href: "/admin/pilot/vendors" },
              { label: "Vendors Approved",   value: String(pilotApproved),  note: "reached approval",                  color: "text-brand-400",   href: "/admin/pilot/vendors" },
              { label: "Active on Platform", value: String(pilotActive),    note: "fully active",                      color: "text-emerald-400", href: "/admin/pilot" },
              { label: "Events Created",     value: String(totalEvents),    note: "customer events",                   color: "text-purple-400",  href: "/admin/bookings" },
              { label: "Feedback Items",     value: "0",                    note: "check pilot report",                color: "text-slate-500",   href: "/admin/pilot/report" },
              { label: "Bugs Open",          value: "—",                    note: "track externally",                  color: "text-slate-600",   href: "/admin/system" },
              { label: "Launch Readiness",   value: "→",                    note: "view checklist",                    color: "text-gold-400",    href: "/admin/launch" },
            ].map(({ label, value, note, color, href }) => (
              <Link key={label} href={href} className="bg-white/3 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors group text-center">
                <div className={`text-2xl font-bold ${color} mb-0.5`}>{value}</div>
                <div className="text-xs text-white font-medium leading-tight">{label}</div>
                <div className="text-xs text-slate-600 mt-0.5 group-hover:text-slate-500 transition-colors leading-tight">{note}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Operations Alerts + Recent Activity ─────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Operations Alerts */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
              <AlertCircle size={15} className="text-amber-400" />Operations Alerts
            </h3>
            <div className="space-y-2">
              {[
                { label: "Vendors awaiting approval",   count: pendingVendorCount, href: "/admin/vendors?status=pending", urgent: pendingVendorCount > 0 },
                { label: "Phone verifications pending",  count: pendingVerif,       href: "/admin/verifications",          urgent: pendingVerif > 0 },
                { label: "Open disputes",                count: disputeCount,       href: "/admin/disputes",               urgent: disputeCount > 0 },
                { label: "Content reports open",         count: openReports,        href: "/admin/moderation",             urgent: openReports > 0 },
                { label: "Flagged vendors",              count: flaggedVendors,     href: "/admin/governance",             urgent: flaggedVendors > 0 },
                { label: "Reviews needing moderation",   count: flaggedReviews,     href: "/admin/reviews",                urgent: flaggedReviews > 0 },
                { label: "Pending quotes (unanswered)",  count: pendingQuotes,      href: "/admin/quotes",                 urgent: pendingQuotes > 5 },
              ].map(({ label, count, href, urgent }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:border-white/10 ${
                    urgent ? "bg-amber-500/6 border-amber-500/20" : "bg-white/3 border-white/6"
                  }`}
                >
                  <span className={`text-sm ${urgent ? "text-white" : "text-slate-500"}`}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${urgent ? "text-amber-400" : "text-slate-600"}`}>
                      {count}
                    </span>
                    <ChevronRight size={12} className="text-slate-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
              <Activity size={15} className="text-brand-400" />Recent Activity
            </h3>
            {activity.length === 0 ? (
              <div className="text-center py-10">
                <Activity size={24} className="text-white/15 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">No activity yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  New signups, vendor applications, and bookings will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                    <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.sub}</p>
                    </div>
                    <span className="text-xs text-slate-600 flex-shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Revenue Summary ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "This Week's Revenue", value: formatCurrency(weeklyRevenue),  sub: `${weeklyBookings.length} bookings`, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Monthly Revenue",     value: formatCurrency(monthlyRevenue), sub: `${monthlyBookings.length} bookings`, icon: BarChart2,  color: "text-brand-400" },
            { label: "Weekly GMV",          value: formatCurrency(weeklyVolume),   sub: "Gross merchandise value",            icon: CreditCard, color: "text-purple-400" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className={color} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Vendor Approvals + Booking Activity ─────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Pending Vendor Approvals */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <AlertCircle size={15} className="text-amber-400" />
                Vendor Approvals
                {pendingVendors.length > 0 && (
                  <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/20">{pendingVendors.length}</span>
                )}
              </h3>
              <Link href="/admin/vendors?status=pending" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {pendingVendors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={22} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">All clear</p>
                <p className="text-slate-600 text-xs mt-1">No pending vendor applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVendors.slice(0, 5).map((vendor) => (
                  <div key={vendor.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6 hover:border-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0">
                      {vendor.business_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{vendor.business_name}</div>
                      <div className="text-xs text-slate-500">
                        {(vendor.profile as { full_name?: string })?.full_name} · {vendor.category.replace(/_/g, " ")} · {vendor.city}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <form action={async () => {
                        "use server";
                        const s = await createAdminClient();
                        await s.from("vendors").update({ status: "rejected" }).eq("id", vendor.id);
                      }}>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/15">
                          Reject
                        </button>
                      </form>
                      <form action={async () => {
                        "use server";
                        const s = await createAdminClient();
                        await s.from("vendors").update({ status: "approved" }).eq("id", vendor.id);
                      }}>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/15">
                          Approve
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Activity */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <TrendingUp size={15} className="text-slate-400" />Booking Activity
              </h3>
              <Link href="/admin/bookings" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: "Pending",   value: pendingAll,   color: "text-amber-400",   bg: "bg-amber-500/10" },
                { label: "Confirmed", value: confirmedAll, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Disputed",  value: disputeCount, color: "text-red-400",     bg: "bg-red-500/10" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingBag size={20} className="text-white/15 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No bookings yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Bookings will appear once customers confirm with vendors.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.map((booking, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={12} className="text-brand-400" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">{formatCurrency(booking.total_amount)}</div>
                        <div className="text-xs text-slate-600">{formatDate(booking.created_at)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={booking.status} />
                      <div className="text-xs text-brand-400 mt-0.5">+{formatCurrency(booking.commission_amount ?? 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: "/admin/vendors?status=pending", icon: "🏪", label: "Review Vendor Applications", badge: pendingVendorCount },
              { href: "/admin/quotes",                  icon: "📥", label: "Open Quote Pipeline",        badge: pendingQuotes },
              { href: "/admin/disputes",                icon: "⚖️",  label: "Check Disputes",             badge: disputeCount },
              { href: "/admin/pilot/vendors",           icon: "🚀", label: "View Pilot CRM",             badge: null },
              { href: "/admin/launch",                  icon: "✅", label: "Launch Readiness",           badge: null },
              { href: "/admin/support",                 icon: "💬", label: "Support Queue",              badge: null },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white/4 border border-white/6 rounded-xl p-4 text-center hover:border-white/10 transition-colors group relative"
              >
                {link.badge ? (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                    {link.badge}
                  </span>
                ) : null}
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{link.icon}</div>
                <div className="text-xs font-medium text-slate-300 leading-tight">{link.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── System Alerts ────────────────────────────────────────────────────── */}
        {recentAlerts.length > 0 && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Bell size={15} className="text-brand-400" />
                System Alerts
                <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/20">{recentAlerts.length} unread</span>
              </h3>
              <Link href="/admin/system" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                System <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {recentAlerts.map((alert) => {
                const sev = alert.severity === "danger"
                  ? "bg-red-500/8 border-red-500/20 text-red-400"
                  : alert.severity === "warning"
                  ? "bg-amber-500/8 border-amber-500/20 text-amber-400"
                  : "bg-white/4 border-white/8 text-slate-400";
                return (
                  <div key={alert.id} className={`flex items-start gap-3 rounded-xl border p-3 ${sev}`}>
                    <Bell size={13} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{alert.title}</p>
                      {alert.body && <p className="text-xs text-slate-500 mt-0.5">{alert.body}</p>}
                    </div>
                    <span className="text-xs text-slate-600 flex-shrink-0">
                      {new Date(alert.created_at as string).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
