import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users, Store, Calendar, CreditCard, TrendingUp, AlertCircle,
  ArrowRight, CheckCircle2, Shield, BarChart2, Eye, Clock,
  MessageSquare, ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const cutoff7  = new Date(); cutoff7.setDate(cutoff7.getDate() - 7);
  const cutoff30 = new Date(); cutoff30.setDate(cutoff30.getDate() - 30);

  const [
    customersRes, vendorsRes, eventsRes,
    bookingsRes, pendingVendorsRes, disputesRes,
    weeklyBookingsRes, pendingVerificationsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("total_amount, commission_amount, status, created_at, vendor_id, customer_id")
      .order("created_at", { ascending: false }).limit(200),
    supabase.from("vendors").select("*, profile:profiles(full_name, email)")
      .eq("status", "pending").order("created_at", { ascending: false }).limit(10),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "disputed"),
    supabase.from("bookings").select("id, total_amount, commission_amount, created_at")
      .gte("created_at", cutoff7.toISOString()).order("created_at", { ascending: false }),
    supabase.from("vendor_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const allBookings      = bookingsRes.data ?? [];
  const weeklyBookings   = weeklyBookingsRes.data ?? [];
  const pendingVendors   = pendingVendorsRes.data ?? [];
  const totalRevenue     = allBookings.reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);
  const weeklyRevenue    = weeklyBookings.reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);
  const weeklyVolume     = weeklyBookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
  const disputeCount     = disputesRes.count ?? 0;
  const pendingVerif     = pendingVerificationsRes.count ?? 0;

  const monthlyBookings  = allBookings.filter((b) => new Date(b.created_at) >= cutoff30);
  const monthlyRevenue   = monthlyBookings.reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);

  const recentBookings   = allBookings.slice(0, 6);
  const confirmedAll     = allBookings.filter((b) => ["confirmed", "completed"].includes(b.status)).length;
  const pendingAll       = allBookings.filter((b) => b.status === "pending").length;

  return (
    <DashboardLayout user={{ ...profile!, role: "admin" }}>
      <div className="max-w-7xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Platform overview and operations management</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/analytics" className="btn-secondary text-sm py-2">
              <BarChart2 size={14} />Analytics
            </Link>
          </div>
        </div>

        {/* Alert Bar */}
        {(pendingVendors.length > 0 || disputeCount > 0 || pendingVerif > 0) && (
          <div className="flex flex-wrap gap-3">
            {pendingVendors.length > 0 && (
              <Link href="/admin/vendors?status=pending" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm hover:bg-amber-500/15 transition-colors">
                <AlertCircle size={14} />
                <span className="font-semibold">{pendingVendors.length}</span> vendors awaiting approval
                <ChevronRight size={13} />
              </Link>
            )}
            {disputeCount > 0 && (
              <Link href="/admin/disputes" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm hover:bg-red-500/15 transition-colors">
                <AlertCircle size={14} />
                <span className="font-semibold">{disputeCount}</span> open disputes
                <ChevronRight size={13} />
              </Link>
            )}
            {pendingVerif > 0 && (
              <Link href="/admin/verifications" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-sm hover:bg-blue-500/15 transition-colors">
                <Shield size={14} />
                <span className="font-semibold">{pendingVerif}</span> verifications pending
                <ChevronRight size={13} />
              </Link>
            )}
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Customers",   value: customersRes.count ?? 0,    icon: Users,     color: "text-blue-400",    href: "/admin/customers" },
            { label: "Active Vendors",    value: vendorsRes.count ?? 0,      icon: Store,     color: "text-brand-400",   href: "/admin/vendors" },
            { label: "Total Events",      value: eventsRes.count ?? 0,       icon: Calendar,  color: "text-emerald-400", href: "/admin/bookings" },
            { label: "Platform Revenue",  value: formatCurrency(totalRevenue), icon: CreditCard, color: "text-gold-400", href: "/admin/payouts" },
          ].map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="bg-white/4 border border-white/6 rounded-xl p-5 hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{label}</span>
                <Icon size={16} className={color} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-600 mt-1 group-hover:text-slate-500 transition-colors flex items-center gap-1">
                View all <ChevronRight size={10} />
              </div>
            </Link>
          ))}
        </div>

        {/* Revenue Summary Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "This Week's Revenue",  value: formatCurrency(weeklyRevenue),  sub: `${weeklyBookings.length} bookings`, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Monthly Revenue",      value: formatCurrency(monthlyRevenue), sub: `${monthlyBookings.length} bookings`, icon: BarChart2, color: "text-brand-400" },
            { label: "Weekly GMV",           value: formatCurrency(weeklyVolume),   sub: "Gross merchandise value",           icon: CreditCard, color: "text-purple-400" },
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Vendor Approvals */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400" />
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} className="text-emerald-400" />
                </div>
                <p className="text-slate-400 text-sm font-medium">All clear!</p>
                <p className="text-slate-600 text-xs mt-1">No pending vendor approvals</p>
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
                        const s = await createClient();
                        await s.from("vendors").update({ status: "rejected" }).eq("id", vendor.id);
                      }}>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/15">
                          Reject
                        </button>
                      </form>
                      <form action={async () => {
                        "use server";
                        const s = await createClient();
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

          {/* Recent Bookings + Status Overview */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-400" />
                Booking Activity
              </h3>
              <Link href="/admin/bookings" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: "Pending",   value: pendingAll,  color: "text-amber-400",   bg: "bg-amber-500/10" },
                { label: "Confirmed", value: confirmedAll, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Disputed",  value: disputeCount, color: "text-red-400",     bg: "bg-red-500/10" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

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
          </div>
        </div>

        {/* Quick Management Links */}
        <div>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Eye size={16} className="text-slate-400" />Quick Management
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { href: "/admin/vendors",       icon: "🏪", label: "Vendors",        badge: pendingVendors.length > 0 ? pendingVendors.length : null },
              { href: "/admin/customers",     icon: "👥", label: "Customers",      badge: null },
              { href: "/admin/bookings",      icon: "📋", label: "Bookings",       badge: pendingAll > 0 ? pendingAll : null },
              { href: "/admin/disputes",      icon: "⚠️", label: "Disputes",       badge: disputeCount > 0 ? disputeCount : null },
              { href: "/admin/payouts",       icon: "💳", label: "Payouts",        badge: null },
              { href: "/admin/verifications", icon: "🛡️", label: "Verifications",  badge: pendingVerif > 0 ? pendingVerif : null },
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
                <div className="text-xs font-medium text-slate-300">{link.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />Platform Health
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Approval Rate",   value: `${allBookings.length > 0 ? Math.round((confirmedAll / allBookings.length) * 100) : 0}%`, color: "text-emerald-400", icon: CheckCircle2 },
              { label: "Active Disputes", value: disputeCount, color: disputeCount > 0 ? "text-red-400" : "text-emerald-400", icon: AlertCircle },
              { label: "Pending Reviews", value: pendingVendors.length, color: pendingVendors.length > 0 ? "text-amber-400" : "text-emerald-400", icon: Clock },
              { label: "Messages",        value: "Active", color: "text-blue-400", icon: MessageSquare },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon size={16} className={`mx-auto mb-1.5 ${color}`} />
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
