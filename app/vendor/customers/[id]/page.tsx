import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerNotesWidget } from "@/components/vendor/CustomerNotesWidget";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft, Mail, Phone, Calendar, ShoppingBag, Star,
  MessageSquare, FileText, TrendingUp, Clock,
} from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

type TimelineEntry =
  | { kind: "quote";    id: string; status: string; event_title?: string; event_date?: string; created_at: string }
  | { kind: "booking";  id: string; status: string; event_title?: string; total_amount: number; created_at: string }
  | { kind: "review";   id: string; rating: number; comment?: string; created_at: string }
  | { kind: "message";  id: string; snippet: string; thread_id: string; created_at: string };

export default async function VendorCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  // ── Security gate ──────────────────────────────────────────────────────────
  // A vendor may only view this page if the customer has at least one booking or
  // quote linked to their vendor account. Both checks run in parallel.
  const [bCheck, qCheck] = await Promise.all([
    supabase.from("bookings").select("id").eq("vendor_id", vendor.id).eq("customer_id", customerId).limit(1),
    supabase.from("quotes").select("id").eq("vendor_id", vendor.id).eq("customer_id", customerId).limit(1),
  ]);
  const isLinked = (bCheck.data?.length ?? 0) > 0 || (qCheck.data?.length ?? 0) > 0;
  if (!isLinked) notFound();

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const [customerProfileRes, bookingsRes, quotesRes, reviewsRes, threadsRes] = await Promise.all([
    // profiles_interaction_network RLS (migration 027) restricts this.
    supabase.from("profiles").select("id, full_name, email, phone, avatar_url, created_at").eq("id", customerId).single(),

    supabase
      .from("bookings")
      .select("id, status, total_amount, vendor_payout, payment_status, created_at, event:events(title, date)")
      .eq("vendor_id", vendor.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),

    supabase
      .from("quotes")
      .select("id, status, created_at, event:events(title, date)")
      .eq("vendor_id", vendor.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),

    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("vendor_id", vendor.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),

    // Most recent message from each thread (to show a snippet in the timeline)
    supabase
      .from("message_threads")
      .select("id, created_at, messages(id, content, created_at, sender_id)")
      .eq("vendor_id", vendor.id)
      .eq("customer_id", customerId)
      .order("last_message_at", { ascending: false }),
  ]);

  const customerProfile = customerProfileRes.data;
  if (!customerProfile) notFound();

  const bookings = bookingsRes.data ?? [];
  const quotes   = quotesRes.data ?? [];
  const reviews  = reviewsRes.data ?? [];
  const threads  = threadsRes.data ?? [];

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const totalSpend = bookings
    .filter((b) => ["confirmed", "accepted", "completed"].includes(b.status))
    .reduce((s, b) => s + (Number(b.vendor_payout ?? 0) || Number(b.total_amount ?? 0) * 0.9), 0);

  const confirmedBookings = bookings.filter((b) =>
    ["confirmed", "accepted", "completed"].includes(b.status)
  );

  const avgBookingValue = confirmedBookings.length > 0
    ? confirmedBookings.reduce((s, b) => s + Number(b.total_amount ?? 0), 0) / confirmedBookings.length
    : null;

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const allDates = [
    ...bookings.map((b) => b.created_at),
    ...quotes.map((q) => q.created_at),
  ].filter(Boolean).sort();

  const firstContact   = allDates[0] ?? null;
  const lastInteraction = allDates[allDates.length - 1] ?? null;

  // ── Build unified timeline ─────────────────────────────────────────────────
  const timeline: TimelineEntry[] = [
    ...bookings.map((b) => {
      const ev = b.event as { title?: string; date?: string } | null;
      return {
        kind: "booking" as const,
        id: b.id,
        status: b.status,
        event_title: ev?.title,
        total_amount: Number(b.total_amount ?? 0),
        created_at: b.created_at,
      };
    }),
    ...quotes.map((q) => {
      const ev = q.event as { title?: string; date?: string } | null;
      return {
        kind: "quote" as const,
        id: q.id,
        status: q.status,
        event_title: ev?.title,
        event_date: ev?.date,
        created_at: q.created_at,
      };
    }),
    ...reviews.map((r) => ({
      kind: "review" as const,
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? undefined,
      created_at: r.created_at,
    })),
    ...threads.flatMap((t) => {
      const msgs = (t.messages ?? []) as { id: string; content: string; created_at: string; sender_id: string }[];
      const latest = [...msgs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      if (!latest) return [];
      return [{
        kind: "message" as const,
        id: latest.id,
        snippet: latest.content.slice(0, 80),
        thread_id: t.id,
        created_at: latest.created_at,
      }];
    }),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const displayName = customerProfile.full_name ?? customerProfile.email;

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <Link
          href="/vendor/customers"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>

        {/* Header */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-700/30 border border-brand-500/20 flex items-center justify-center text-xl font-bold text-brand-300 flex-shrink-0">
              {customerProfile.avatar_url ? (
                <img src={customerProfile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                <a
                  href={`mailto:${customerProfile.email}`}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-brand-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {customerProfile.email}
                </a>
                {customerProfile.phone && (
                  <a
                    href={`tel:${customerProfile.phone}`}
                    className="flex items-center gap-1.5 text-sm text-white/50 hover:text-brand-300 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {customerProfile.phone}
                  </a>
                )}
                {firstContact && (
                  <span className="flex items-center gap-1.5 text-sm text-white/35">
                    <Calendar className="w-3.5 h-3.5" />
                    First contact: {formatDate(firstContact)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Spend"    value={formatCurrency(totalSpend)}                                  icon={TrendingUp}   color="text-amber-400" />
          <StatCard label="Bookings"       value={String(bookings.length)}                                      icon={ShoppingBag}  color="text-green-400" />
          <StatCard label="Avg Booking"    value={avgBookingValue ? formatCurrency(avgBookingValue) : "—"}      icon={FileText}     color="text-violet-400" />
          <StatCard label="Rating Given"   value={avgRating ? `${avgRating.toFixed(1)} ★` : "—"}               icon={Star}         color="text-yellow-400" />
        </div>

        {/* Second stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white/4 border border-white/6 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-1">Quote requests</p>
            <p className="text-white font-bold text-lg">{quotes.length}</p>
          </div>
          <div className="bg-white/4 border border-white/6 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-1">Last interaction</p>
            <p className="text-white font-bold text-lg">{lastInteraction ? formatDate(lastInteraction) : "—"}</p>
          </div>
          <div className="bg-white/4 border border-white/6 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-1">Reviews left</p>
            <p className="text-white font-bold text-lg">{reviews.length}</p>
          </div>
        </div>

        {/* Timeline + Quick actions — two-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline — takes 2 cols */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              Activity Timeline
            </h2>
            {timeline.length === 0 ? (
              <div className="bg-white/4 border border-white/6 rounded-xl p-8 text-center">
                <p className="text-white/30 text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.map((entry) => (
                  <TimelineCard key={`${entry.kind}-${entry.id}`} entry={entry} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {threads.length > 0 && (
                  <Link
                    href={`/vendor/messages?thread=${threads[0].id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 border border-white/6 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    View messages
                  </Link>
                )}
                {bookings.length > 0 && (
                  <Link
                    href={`/vendor/bookings/${bookings[0].id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 border border-white/6 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-green-400" />
                    Latest booking
                  </Link>
                )}
                {quotes.length > 0 && (
                  <Link
                    href="/vendor/quotes"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 border border-white/6 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-violet-400" />
                    View quotes
                  </Link>
                )}
              </div>
            </div>

            {/* CRM Notes */}
            <CustomerNotesWidget customerId={customerId} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/40 text-xs">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-white font-bold text-lg">{value}</p>
    </div>
  );
}

function TimelineCard({ entry }: { entry: TimelineEntry }) {
  if (entry.kind === "booking") {
    return (
      <Link
        href={`/vendor/bookings/${entry.id}`}
        className="block bg-white/4 border border-white/6 rounded-xl p-4 hover:border-green-500/25 transition-colors group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShoppingBag className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">Booking</span>
                <StatusBadge status={entry.status} />
              </div>
              {entry.event_title && <p className="text-white/40 text-xs mt-0.5">{entry.event_title}</p>}
              <p className="text-white/30 text-xs mt-1">{formatDate(entry.created_at)}</p>
            </div>
          </div>
          <span className="text-white font-semibold text-sm flex-shrink-0">{formatCurrency(entry.total_amount)}</span>
        </div>
      </Link>
    );
  }

  if (entry.kind === "quote") {
    return (
      <div className="bg-white/4 border border-white/6 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Quote request</span>
              <StatusBadge status={entry.status} />
            </div>
            {entry.event_title && <p className="text-white/40 text-xs mt-0.5">{entry.event_title}</p>}
            {entry.event_date  && <p className="text-white/30 text-xs">Event date: {formatDate(entry.event_date)}</p>}
            <p className="text-white/30 text-xs mt-1">{formatDate(entry.created_at)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (entry.kind === "review") {
    return (
      <div className="bg-white/4 border border-white/6 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Review</span>
              <span className="text-yellow-400 text-xs font-bold">{"★".repeat(entry.rating)}</span>
            </div>
            {entry.comment && <p className="text-white/50 text-xs mt-1 italic">&ldquo;{entry.comment}&rdquo;</p>}
            <p className="text-white/30 text-xs mt-1">{formatDate(entry.created_at)}</p>
          </div>
        </div>
      </div>
    );
  }

  // message
  return (
    <Link
      href={`/vendor/messages?thread=${entry.thread_id}`}
      className="block bg-white/4 border border-white/6 rounded-xl p-4 hover:border-blue-500/25 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <span className="text-white text-sm font-medium">Message</span>
          {entry.snippet && <p className="text-white/40 text-xs mt-0.5 truncate max-w-xs">{entry.snippet}…</p>}
          <p className="text-white/30 text-xs mt-1">{formatDate(entry.created_at)}</p>
        </div>
      </div>
    </Link>
  );
}
