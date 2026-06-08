"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, Plus, ChevronRight, CheckSquare, Sparkles } from "lucide-react";
import { formatDate, daysUntilEvent, cn } from "@/lib/utils";
import { EVENT_TYPES } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";

interface CustomerEventsViewProps {
  events: Record<string, unknown>[];
}

export function CustomerEventsView({ events }: CustomerEventsViewProps) {
  const today = new Date();
  const upcoming = events.filter((e) => new Date(String(e.date)) >= today);
  const past = events.filter((e) => new Date(String(e.date)) < today);

  function EventCard({ event }: { event: Record<string, unknown> }) {
    const bookings = (event.bookings as Array<Record<string, unknown>>) ?? [];
    const eventType = EVENT_TYPES[String(event.event_type ?? "") as keyof typeof EVENT_TYPES];
    const days = daysUntilEvent(String(event.date));
    const isPast = days < 0;
    const totalSpent = bookings
      .filter((b) => ["accepted", "confirmed", "completed"].includes(String(b.status)))
      .reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0);

    return (
      <Link href={`/dashboard/events/${String(event.id)}`} className="bg-white/4 border border-white/6 rounded-xl p-5 card-hover block group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{eventType?.icon ?? "🎉"}</div>
            <div>
              <h3 className="font-bold text-white group-hover:text-brand-300 transition-colors">
                {String(event.title)}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(String(event.date))}</span>
                {!!event.city && <span className="flex items-center gap-1"><MapPin size={10} />{String(event.city)}</span>}
                {!!event.guest_count && <span className="flex items-center gap-1"><Users size={10} />{String(event.guest_count)} guests</span>}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {!isPast && (
            <span className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium",
              days <= 7 ? "bg-red-500/20 text-red-400 border border-red-500/30" :
              days <= 30 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
              "bg-green-500/20 text-green-400 border border-green-500/30"
            )}>
              {days === 0 ? "Today!" : `${days}d away`}
            </span>
          )}
          {isPast && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/20">
              Past event
            </span>
          )}

          {bookings.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckSquare size={11} />{bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </span>
          )}

          {totalSpent > 0 && (
            <span className="text-xs text-slate-400">
              £{totalSpent.toLocaleString()} budgeted
            </span>
          )}

          {bookings.slice(0, 3).map((b, i) => (
            <StatusBadge key={i} status={String(b.status)} />
          ))}
        </div>
      </Link>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Events</h1>
          <p className="text-slate-400 text-sm mt-1">{events.length} event{events.length !== 1 ? "s" : ""} created</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary">
          <Plus size={15} />New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h3 className="font-bold text-white mb-2">Start planning your first event</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Our Smart Planner builds a complete event plan (vendors, budget, timeline and checklist) in minutes.
          </p>
          <Link href="/dashboard/events/new" className="btn-primary">
            <Sparkles size={15} /> Plan My Event
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
              {upcoming.map((event) => <EventCard key={String(event.id)} event={event} />)}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Past Events ({past.length})</h2>
              {past.map((event) => <EventCard key={String(event.id)} event={event} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
