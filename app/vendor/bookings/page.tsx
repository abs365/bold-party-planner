import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag, Calendar, Users, Camera, ArrowRight } from "lucide-react";
import { PendingVendorBanner } from "@/components/vendor/PendingVendorBanner";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id, status").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, event:events(title, date, city, guest_count), customer:profiles(full_name, email, phone)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const allBookings = (bookings ?? []) as Booking[];
  const statuses = ["pending", "accepted", "pending_payment", "confirmed", "completed", "rejected", "cancelled"];

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {vendor.status === "pending" && <PendingVendorBanner />}
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your booking requests</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {["all", ...statuses].map((s) => {
            const count = s === "all" ? allBookings.length : allBookings.filter((b) => b.status === s).length;
            if (s !== "all" && count === 0) return null;
            return (
              <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/6 border border-white/10">
                <span className="capitalize">{s}</span>
                <span className="badge bg-white/10 text-slate-300 text-xs">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {allBookings.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-white/4 border border-white/6 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={24} className="text-slate-500" />
                </div>
                <h3 className="font-bold text-white mb-2">No bookings yet</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                  Bookings appear here once customers reserve your services. A complete profile with photos and availability set gets 4x more enquiries.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/vendor/media" className="btn-primary text-sm py-2 px-4">
                    <Camera size={14} /> Upload Photos
                  </Link>
                  <Link href="/vendor/quotes" className="btn-secondary text-sm py-2 px-4">
                    View Leads <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            allBookings.map((booking) => {
              const event = booking.event as Record<string, unknown>;
              const customer = booking.customer as Record<string, unknown>;
              return (
                <Link
                  key={booking.id}
                  href={`/vendor/bookings/${booking.id}`}
                  className="bg-white/4 border border-white/6 rounded-xl p-5 flex items-center justify-between hover:border-brand-500/30 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                        {String(event?.title ?? "Event")}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {event?.date ? formatDate(String(event.date)) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {String(event?.guest_count ?? 0)} guests
                      </span>
                      <span>{String(customer?.full_name ?? "Customer")}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-white">{formatCurrency(booking.total_amount)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{formatDate(booking.created_at)}</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
