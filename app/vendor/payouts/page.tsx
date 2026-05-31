import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorPayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/onboarding");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, total_amount, deposit_amount, status, created_at, event:events(title, date)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const confirmedBookings = (bookings ?? []).filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
  const depositRevenue = confirmedBookings.reduce((sum, b) => sum + (b.deposit_amount ?? 0), 0);
  const pendingBookings = (bookings ?? []).filter((b) => b.status === "pending");
  const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (b.deposit_amount ?? 0), 0);

  const fmt = (n: number) => `Â£${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue &amp; Payouts</h1>
          <p className="text-slate-400 text-sm mt-1">Track your earnings and payment history</p>
        </div>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Total Confirmed Revenue", value: fmt(totalRevenue), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Deposits Received", value: fmt(depositRevenue), icon: CheckCircle2, color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
            { label: "Pending Deposits", value: fmt(pendingRevenue), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/4 border border-white/6 rounded-xl p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} border flex items-center justify-center mb-3`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Platform earnings note */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-start gap-3">
          <Wallet size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">Your earnings rate: 90%</p>
            <p className="text-xs text-slate-400">ELBOLD Events retains a 10% platform fee on each confirmed booking. Payouts are processed within 7 business days of event completion via your connected bank account.</p>
          </div>
        </div>

        {/* Booking breakdown */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Booking Revenue</h2>
          {(bookings ?? []).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={28} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No bookings yet. Revenue will appear here once customers book your services.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(bookings ?? []).map((booking) => {
                const eventTitle = (booking.event as { title?: string; date?: string } | null)?.title ?? "Untitled Event";
                const eventDate = (booking.event as { title?: string; date?: string } | null)?.date;
                const statusColors: Record<string, string> = {
                  confirmed: "text-emerald-400 bg-emerald-500/10",
                  completed: "text-blue-400 bg-blue-500/10",
                  pending: "text-amber-400 bg-amber-500/10",
                  cancelled: "text-red-400 bg-red-500/10",
                };
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/6 hover:bg-white/6 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{eventTitle}</div>
                      <div className="text-xs text-slate-500">{eventDate ? new Date(eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date TBD"}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[booking.status] ?? "text-slate-400 bg-white/8"}`}>
                        {booking.status}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{fmt(booking.total_amount ?? 0)}</div>
                        <div className="text-xs text-slate-500">deposit: {fmt(booking.deposit_amount ?? 0)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payout information — manual process during beta */}
        <div className="bg-white/4 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">How Payouts Work</h2>
            <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">Beta Period</span>
          </div>
          <div className="space-y-3 text-sm text-slate-400">
            <p>During our launch period, payouts are processed manually by the ELBOLD team within 7 working days of a booking being marked complete.</p>
            <p>ELBOLD retains a <span className="text-white font-medium">10% platform fee</span>. You receive 90% of the confirmed booking value.</p>
            <p>To receive your payout, ensure your account details are on file. Contact <span className="text-white">support@elbold.com</span> if you have any questions.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/6">
            <p className="text-xs text-slate-500">Automated bank payouts via Stripe Connect are coming. You will be notified when this goes live.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
