import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { CustomerEventHub } from "@/components/customer/CustomerEventHub";
import { formatCurrency, formatDate, daysUntilEvent } from "@/lib/utils";
import {
  Calendar, ShoppingBag, CreditCard, Sparkles, ArrowRight,
  CheckCircle2, Plus,
} from "lucide-react";
import { SmartTipsWidget } from "@/components/smart/SmartTipsWidget";
import type { Event, Booking } from "@/types";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  // Role-based routing — each role has its own portal
  if (profile.role === "vendor") redirect("/vendor/dashboard");
  if (profile.role === "admin") redirect("/admin");

  const [eventsRes, bookingsRes] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("customer_id", user.id)
      .order("date", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("id, total_amount, payment_status, status, created_at, vendor:vendors(business_name, category), event:events(title, date)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const events = (eventsRes.data ?? []) as Event[];
  const bookings = (bookingsRes.data ?? []) as unknown as Booking[];

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const nextEvent = upcomingEvents[0] ?? null;

  const nextEventBookings = nextEvent
    ? bookings.filter((b) => (b.event as { title?: string; date?: string } | null) !== null)
    : [];

  const totalSpent = bookings
    .filter((b) => b.payment_status === "fully_paid" || b.payment_status === "deposit_paid")
    .reduce((sum, b) => sum + b.total_amount, 0);

  const stats = [
    { label: "Upcoming Events", value: upcomingEvents.length, icon: Calendar, color: "text-brand-400" },
    { label: "Total Bookings", value: bookings.length, icon: ShoppingBag, color: "text-blue-400" },
    { label: "Total Spent", value: formatCurrency(totalSpent), icon: CreditCard, color: "text-emerald-400" },
    { label: "Events Completed", value: events.filter((e) => e.status === "completed").length, icon: CheckCircle2, color: "text-amber-400" },
  ];

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {profile.full_name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {upcomingEvents.length > 0
                ? `You have ${upcomingEvents.length} upcoming event${upcomingEvents.length > 1 ? "s" : ""}`
                : "Ready to plan your next event?"}
            </p>
          </div>
          <Link href="/dashboard/create-event" className="btn-primary">
            <Plus size={16} />
            New Event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{label}</span>
                <Icon size={17} className={color} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Smart Planner CTA — shown when no events */}
        {upcomingEvents.length === 0 && (
          <div className="bg-white/4 border border-white/6 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Start Planning Your First Event</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Our Smart Planner builds a complete event plan: vendors, budget, timeline and checklist.
            </p>
            <Link href="/dashboard/create-event" className="btn-primary">
              <Sparkles size={15} />
              Plan My Event
              <ArrowRight size={15} />
            </Link>
          </div>
        )}

        <div className={nextEvent ? "grid lg:grid-cols-3 gap-6" : "grid lg:grid-cols-2 gap-6"}>
          {/* Event Hub — next upcoming event */}
          {nextEvent && (
            <div className="lg:col-span-1">
              <CustomerEventHub event={nextEvent} bookings={nextEventBookings} />
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                Upcoming Events
              </h3>
              <Link href="/dashboard/events" className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No upcoming events</p>
              ) : (
                upcomingEvents.slice(0, 4).map((event) => {
                  const days = daysUntilEvent(event.date);
                  return (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-lg">
                          🎉
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                            {event.title}
                          </div>
                          <div className="text-xs text-slate-500">{formatDate(event.date)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-amber-400">
                          {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days`}
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ShoppingBag size={16} className="text-slate-400" />
                Recent Bookings
              </h3>
              <Link href="/dashboard/bookings" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm mb-3">No bookings yet</p>
                  <Link href="/browse" className="btn-secondary text-xs py-2 px-4">
                    Browse Vendors
                  </Link>
                </div>
              ) : (
                bookings.slice(0, 4).map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                        {(booking.vendor as { business_name?: string })?.business_name ?? "Vendor"}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">
                        {(booking.vendor as { category?: string })?.category?.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(booking.total_amount)}
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Smart Tips */}
        <SmartTipsWidget />

        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold text-slate-300 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/create-event", icon: "✨", label: "Plan New Event" },
              { href: "/browse", icon: "🔍", label: "Browse Vendors" },
              { href: "/dashboard/events", icon: "📅", label: "My Events" },
              { href: "/dashboard/payments", icon: "💳", label: "Payments" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white/4 border border-white/6 rounded-xl p-4 text-center hover:bg-white/6 hover:border-white/10 transition-colors group"
              >
                <div className="text-xl mb-2">{action.icon}</div>
                <div className="text-xs font-medium text-slate-400 group-hover:text-slate-300">{action.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
