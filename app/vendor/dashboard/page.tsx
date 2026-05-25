import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { VendorTrustBadge } from "@/components/ui/TrustBadges";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag, CreditCard, Star, Eye, TrendingUp, ArrowRight,
  CheckCircle2, AlertCircle, MessageSquare, Quote, Calendar,
  Zap, BarChart2, Award, Bell, Clock, Users, ChevronRight,
} from "lucide-react";
import type { Booking, Vendor } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/vendor/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*, media:vendor_media(*), packages:vendor_packages(*)")
    .eq("user_id", user.id)
    .single();

  if (!vendor) redirect("/vendor/apply");

  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);

  const [bookingsRes, reviewsRes, analyticsRes, quotesRes, unreadRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, event:events(title, date, city, guest_count), customer:profiles(full_name, email, avatar_url)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("reviews")
      .select("*, profile:profiles(full_name, avatar_url)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("vendor_analytics")
      .select("event_type, created_at")
      .eq("vendor_id", vendor.id)
      .gte("created_at", cutoff30.toISOString()),
    supabase
      .from("quotes")
      .select("id, status, created_at")
      .eq("vendor_id", vendor.id)
      .eq("status", "pending"),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  const allBookings  = (bookingsRes.data ?? []) as Booking[];
  const reviews      = reviewsRes.data ?? [];
  const analytics    = analyticsRes.data ?? [];
  const pendingQuotes = quotesRes.data ?? [];
  const unreadCount  = unreadRes.count ?? 0;

  const pending   = allBookings.filter((b) => b.status === "pending");
  const confirmed = allBookings.filter((b) => b.status === "confirmed" || b.status === "accepted");
  const upcoming  = allBookings.filter((b) => {
    const ev = b.event as { date?: string } | undefined;
    return ev?.date && new Date(ev.date) > new Date() && ["accepted", "confirmed"].includes(b.status);
  });
  const earned = allBookings
    .filter((b) => b.payment_status === "fully_paid")
    .reduce((sum, b) => sum + b.vendor_payout, 0);
  const pendingPayout = allBookings
    .filter((b) => b.payment_status === "deposit_paid" && b.status === "confirmed")
    .reduce((sum, b) => sum + b.vendor_payout, 0);

  const profileViews  = analytics.filter((a) => a.event_type === "profile_view").length;
  const quoteRequests = analytics.filter((a) => a.event_type === "quote_request").length;
  const conversionRate = profileViews > 0 ? ((confirmed.length / profileViews) * 100).toFixed(1) : "0.0";

  const profileCompletion = [
    vendor.bio,
    vendor.location,
    (vendor as Vendor & { media?: unknown[] }).media?.length,
    (vendor as Vendor & { packages?: unknown[] }).packages?.length,
    vendor.min_price,
  ].filter(Boolean).length;

  const profileItems = [
    { label: "Bio",      done: !!vendor.bio,                                                         href: "/vendor/profile" },
    { label: "Location", done: !!vendor.location,                                                    href: "/vendor/profile" },
    { label: "Photos",   done: !!((vendor as Vendor & { media?: unknown[] }).media?.length),         href: "/vendor/media" },
    { label: "Packages", done: !!((vendor as Vendor & { packages?: unknown[] }).packages?.length),   href: "/vendor/services" },
    { label: "Pricing",  done: !!vendor.min_price,                                                   href: "/vendor/services" },
  ];

  const nowMs = new Date().getTime();

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{vendor.business_name}</h1>
              <StatusBadge status={vendor.status} />
              {unreadCount > 0 && (
                <Link href="/vendor/messages" className="flex items-center gap-1.5 badge bg-brand-500/20 text-brand-300 border border-brand-500/20">
                  <Bell size={11} />
                  {unreadCount} new
                </Link>
              )}
            </div>
            <VendorTrustBadge
              verified={vendor.verified}
              reviewCount={vendor.review_count}
              yearsExperience={vendor.years_experience}
              subscriptionPlan={vendor.subscription_plan}
              className="mt-2"
            />
            {vendor.status === "pending" && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                <Clock size={11} />
                Your application is under review — usually approved within 24 hours.
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/vendors/${vendor.id}`} className="btn-secondary text-sm py-2">
              <Eye size={14} />View Profile
            </Link>
            <Link href="/vendor/analytics" className="btn-secondary text-sm py-2">
              <BarChart2 size={14} />Analytics
            </Link>
          </div>
        </div>

        {/* ─── Profile Completion ───────────────────────────────────── */}
        {profileCompletion < 5 && (
          <div className="glass-card p-5 border border-amber-500/20 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
              <span className="font-semibold text-white text-sm">
                Complete your profile to start receiving bookings
              </span>
              <span className="ml-auto text-sm text-amber-400 font-bold whitespace-nowrap">{profileCompletion}/5</span>
            </div>
            <div className="bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${(profileCompletion / 5) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {profileItems.map(({ label, done, href }) => (
                <Link key={label} href={href} className={cn_cls(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                  done ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15" : "text-slate-400 bg-white/4 border border-white/8 hover:border-brand-500/20 hover:bg-white/6"
                )}>
                  {done ? <CheckCircle2 size={11} /> : <span className="w-3 h-3 rounded-full border border-current opacity-50" />}
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── KPI Stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "New Requests",
              value: pending.length,
              icon: ShoppingBag,
              color: "text-amber-400",
              urgent: pending.length > 0,
              sub: pending.length > 0 ? "Needs your attention" : "All caught up",
              href: "/vendor/bookings",
            },
            {
              label: "Active Bookings",
              value: confirmed.length,
              icon: CheckCircle2,
              color: "text-blue-400",
              urgent: false,
              sub: `${upcoming.length} upcoming`,
              href: "/vendor/bookings",
            },
            {
              label: "Revenue Earned",
              value: formatCurrency(earned),
              icon: CreditCard,
              color: "text-emerald-400",
              urgent: false,
              sub: pendingPayout > 0 ? `${formatCurrency(pendingPayout)} pending` : "Up to date",
              href: "/vendor/bookings",
            },
            {
              label: "Avg Rating",
              value: vendor.rating > 0 ? `${vendor.rating.toFixed(1)}` : "—",
              icon: Star,
              color: "text-gold-400",
              urgent: false,
              sub: `${vendor.review_count ?? 0} reviews`,
              href: "/vendor/reviews",
            },
          ].map(({ label, value, icon: Icon, color, urgent, sub, href }) => (
            <Link
              key={label}
              href={href}
              className={cn_cls(
                "glass-card p-5 card-hover hover:border-brand-500/20 transition-all group",
                urgent ? "border border-amber-500/25" : ""
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
                <Icon size={16} className={color} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className={cn_cls("text-xs", urgent ? "text-amber-400 font-medium" : "text-slate-600")}>{sub}</div>
            </Link>
          ))}
        </div>

        {/* ─── 30-day Performance ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Profile Views",   value: profileViews,   icon: Eye,       color: "text-brand-400",   href: "/vendor/analytics" },
            { label: "Quote Requests",  value: quoteRequests,  icon: TrendingUp, color: "text-purple-400",  href: "/vendor/quotes" },
            { label: "Conversion Rate", value: `${conversionRate}%`, icon: BarChart2, color: "text-emerald-400", href: "/vendor/analytics" },
          ].map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="glass-card p-4 border border-white/5 hover:border-brand-500/15 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className={color} />
                <span className="text-xs text-slate-500">{label}</span>
                <span className="ml-auto text-slate-700 group-hover:text-slate-500 transition-colors">
                  <ChevronRight size={12} />
                </span>
              </div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-600 mt-0.5">Last 30 days</div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── Pending Bookings ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShoppingBag size={16} className="text-brand-400" />
                  Booking Requests
                  {pending.length > 0 && (
                    <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/20">{pending.length}</span>
                  )}
                </h3>
                <Link href="/vendor/bookings" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </Link>
              </div>

              {allBookings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag size={22} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm mb-1">No bookings yet</p>
                  <p className="text-slate-600 text-xs">
                    {profileCompletion < 5
                      ? "Complete your profile to start attracting customers"
                      : "Your profile is ready — customers can now discover you"}
                  </p>
                  {profileCompletion < 5 && (
                    <Link href="/vendor/profile" className="btn-primary text-xs mt-4 inline-flex py-2 px-4">
                      Complete Profile
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {allBookings.slice(0, 8).map((booking) => {
                    const ev = booking.event as { title?: string; date?: string; city?: string; guest_count?: number } | undefined;
                    const cust = booking.customer as { full_name?: string; avatar_url?: string } | undefined;
                    const isPending = booking.status === "pending";
                    return (
                      <Link
                        key={booking.id}
                        href={`/vendor/bookings/${booking.id}`}
                        className={cn_cls(
                          "flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border transition-all group",
                          isPending ? "border-amber-500/20 bg-amber-500/3" : "border-white/5 bg-white/2"
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {(cust?.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm group-hover:text-brand-400 transition-colors truncate">
                            {ev?.title ?? "Event"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {cust?.full_name}
                            {ev?.date && ` · ${formatDate(ev.date)}`}
                            {ev?.guest_count && ` · ${ev.guest_count} guests`}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-white">{formatCurrency(booking.total_amount)}</div>
                          <StatusBadge status={booking.status} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Quotes Alert */}
            {pendingQuotes.length > 0 && (
              <div className="glass-card p-5 border border-purple-500/20 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <Quote size={15} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {pendingQuotes.length} pending quote {pendingQuotes.length > 1 ? "requests" : "request"}
                      </div>
                      <div className="text-xs text-slate-500">Respond quickly to improve your ranking</div>
                    </div>
                  </div>
                  <Link href="/vendor/quotes" className="btn-primary text-xs py-2 px-3">
                    Respond <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Panel: Quick Actions + Reviews ──────────── */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm">
                <Zap size={14} className="text-brand-400" />Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { href: "/vendor/bookings",     icon: ShoppingBag,   label: "Manage Bookings",    badge: pending.length > 0 ? pending.length : null,   color: "text-amber-400" },
                  { href: "/vendor/quotes",        icon: Quote,          label: "Quote Requests",     badge: pendingQuotes.length > 0 ? pendingQuotes.length : null, color: "text-purple-400" },
                  { href: "/vendor/messages",      icon: MessageSquare,  label: "Messages",           badge: null,             color: "text-blue-400" },
                  { href: "/vendor/availability",  icon: Calendar,       label: "Update Availability", badge: null,             color: "text-emerald-400" },
                  { href: "/vendor/analytics",     icon: BarChart2,      label: "View Analytics",     badge: null,             color: "text-brand-400" },
                  { href: "/vendor/subscription",  icon: Award,          label: "Upgrade Plan",       badge: null,             color: "text-gold-400" },
                ].map(({ href, icon: Icon, label, badge, color }) => (
                  <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                    <Icon size={14} className={color} />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{label}</span>
                    {badge ? (
                      <span className="badge bg-amber-500/20 text-amber-400 text-xs">{badge}</span>
                    ) : (
                      <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <Star size={14} className="text-gold-400" />Recent Reviews
                </h3>
                <Link href="/vendor/reviews" className="text-xs text-brand-400 hover:text-brand-300">
                  All <ArrowRight size={11} className="inline" />
                </Link>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-6">
                  <Star size={24} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">No reviews yet</p>
                  <p className="text-xs text-slate-600 mt-1">Complete bookings to start getting reviews</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-3 rounded-xl bg-white/3 border border-white/6">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-white">
                          {(review.profile as { full_name?: string })?.full_name ?? "Customer"}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < review.rating ? "star-filled text-xs" : "star-empty text-xs"}>★</span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-slate-400 line-clamp-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-semibold text-white flex items-center gap-2 mb-4 text-sm">
                  <Calendar size={14} className="text-brand-400" />Upcoming Events
                </h3>
                <div className="space-y-2">
                  {upcoming.slice(0, 3).map((booking) => {
                    const ev = booking.event as { title?: string; date?: string; city?: string } | undefined;
                    const daysLeft = ev?.date
                      ? Math.ceil((new Date(ev.date).getTime() - nowMs) / 86400000)
                      : null;
                    return (
                      <Link key={booking.id} href={`/vendor/bookings/${booking.id}`}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                        <div className={cn_cls(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                          daysLeft !== null && daysLeft <= 7 ? "bg-amber-500/20 text-amber-400" : "bg-brand-500/15 text-brand-400"
                        )}>
                          {daysLeft ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{ev?.title ?? "Event"}</div>
                          <div className="text-xs text-slate-500">{ev?.city}{ev?.date && ` · ${formatDate(ev.date)}`}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subscription Upgrade */}
            {vendor.subscription_plan === "free" && (
              <div className="glass-card p-5 border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent">
                <div className="flex items-start gap-3">
                  <Award size={18} className="text-gold-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">Upgrade to Pro</div>
                    <div className="text-xs text-slate-400 mb-3">
                      Get priority placement, analytics, and more bookings with a Pro subscription.
                    </div>
                    <Link href="/vendor/subscription" className="btn-primary text-xs py-2 px-3">
                      View Plans
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Stats Footer */}
        <div className="glass-card p-5 border border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-brand-400" />
              <span className="text-sm text-slate-400">Your profile has received</span>
              <span className="font-bold text-white">{vendor.profile_views ?? 0}</span>
              <span className="text-sm text-slate-400">total views</span>
            </div>
            <Link href="/vendor/analytics" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Full analytics <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function cn_cls(...classes: string[]) { return classes.filter(Boolean).join(" "); }
