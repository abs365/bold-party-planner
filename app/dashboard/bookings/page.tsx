import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag, ArrowRight, Calendar, MapPin, Plus } from "lucide-react";
import type { Profile, Booking } from "@/types";

export const dynamic = "force-dynamic";

export default async function BookingsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city),
      event:events(title, date, city)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const typedProfile = profile as Profile;
  const allBookings = (bookings ?? []) as Booking[];

  const grouped = {
    active: allBookings.filter((b) => ["pending","accepted","confirmed"].includes(b.status)),
    completed: allBookings.filter((b) => b.status === "completed"),
    other: allBookings.filter((b) => ["cancelled","rejected","disputed"].includes(b.status)),
  };

  return (
    <DashboardLayout user={typedProfile}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingBag size={22} className="text-brand-400" />
              My Bookings
            </h1>
            <p className="text-slate-400 text-sm mt-1">{allBookings.length} total booking{allBookings.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/browse" className="btn-primary text-sm py-2 px-4">
            <Plus size={15} />
            Book a Vendor
          </Link>
        </div>

        {allBookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-bold text-white mb-2">No bookings yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Browse our verified vendors and make your first booking to get started.
            </p>
            <Link href="/browse" className="btn-primary">
              Browse Vendors <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([group, items]) => {
              if (items.length === 0) return null;
              const labels: Record<string, string> = { active: "Active Bookings", completed: "Completed", other: "Cancelled / Declined" };
              return (
                <div key={group}>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{labels[group]}</h2>
                  <div className="space-y-3">
                    {items.map((booking) => {
                      const vendor = booking.vendor as { id?: string; business_name?: string; category?: string; city?: string } | null;
                      const event = booking.event as { title?: string; date?: string; city?: string } | null;
                      return (
                        <Link
                          key={booking.id}
                          href={`/dashboard/bookings/${booking.id}`}
                          className="glass-card p-5 flex items-center justify-between hover:border-brand-500/30 transition-all card-hover group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-xl flex-shrink-0">
                              🎉
                            </div>
                            <div>
                              <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                                {vendor?.business_name ?? "Vendor"}
                              </h3>
                              <p className="text-xs text-slate-500 capitalize mt-0.5">
                                {vendor?.category?.replace("_", " ")}
                              </p>
                              {event && (
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="flex items-center gap-1 text-xs text-slate-600">
                                    <Calendar size={10} /> {event.date ? formatDate(event.date) : "—"}
                                  </span>
                                  {event.city && (
                                    <span className="flex items-center gap-1 text-xs text-slate-600">
                                      <MapPin size={10} /> {event.city}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-base font-bold text-white mb-1">{formatCurrency(booking.total_amount)}</div>
                            <StatusBadge status={booking.status} />
                            <div className="mt-1">
                              <StatusBadge status={booking.payment_status} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
