"use client";

import Link from "next/link";
import {
  Calendar, Clock, CheckCircle2, Circle, ArrowRight, Sparkles,
  Camera, Music, Utensils, Flower2, Building2, Car, ChevronRight,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Event, Booking } from "@/types";

interface CustomerEventHubProps {
  event: Event;
  bookings: Booking[];
}

const CHECKLIST_ITEMS = [
  { key: "venue", label: "Venue booked", icon: Building2, category: "venue" },
  { key: "catering", label: "Catering arranged", icon: Utensils, category: "catering" },
  { key: "photographer", label: "Photographer booked", icon: Camera, category: "photography" },
  { key: "entertainment", label: "Entertainment booked", icon: Music, category: "entertainment" },
  { key: "florist", label: "Flowers & décor", icon: Flower2, category: "florist" },
  { key: "transport", label: "Transport sorted", icon: Car, category: "transport" },
];

function getCountdown(dateStr: string) {
  const event = new Date(dateStr);
  const now = new Date();
  const diff = event.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { value: days, unit: days === 1 ? "day" : "days" };
  return { value: hours, unit: hours === 1 ? "hour" : "hours" };
}

export function CustomerEventHub({ event, bookings }: CustomerEventHubProps) {
  const countdown = getCountdown(event.date);
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "accepted");
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const totalBudget = event.budget ?? 0;
  const totalSpent = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.total_amount, 0);
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const bookedCategories = new Set(
    confirmedBookings.map((b) => (b.vendor as { category?: string })?.category ?? "")
  );

  const checklistDone = CHECKLIST_ITEMS.filter((item) => bookedCategories.has(item.category)).length;
  const progressPct = Math.round((checklistDone / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-xs text-brand-400 font-semibold uppercase tracking-widest">Next Event</span>
          </div>
          <h2 className="text-xl font-bold text-white">{event.title}</h2>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
            <Calendar size={13} />
            {formatDate(event.date)}
          </p>
        </div>
        {countdown && (
          <div className="text-right">
            <div className="text-3xl font-extrabold text-white leading-none">{countdown.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{countdown.unit} to go</div>
            <div className="flex items-center gap-1 justify-end mt-1 text-xs text-amber-400">
              <Clock size={11} />
              <span>Countdown</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Planning Progress</span>
          <span className="text-xs font-bold text-brand-400">{progressPct}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full gradient-brand rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
          <span>{checklistDone} of {CHECKLIST_ITEMS.length} key vendors booked</span>
          {confirmedBookings.length > 0 && (
            <span className="text-emerald-400">{confirmedBookings.length} confirmed</span>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vendor Checklist</h3>
        <div className="grid grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map((item) => {
            const done = bookedCategories.has(item.category);
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  done
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/4 text-slate-500"
                }`}
              >
                {done ? (
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle size={13} className="text-slate-600 flex-shrink-0" />
                )}
                <Icon size={12} className="flex-shrink-0" />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Tracker */}
      {totalBudget > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Budget Tracker</span>
            <span className={`text-xs font-bold ${budgetPct >= 90 ? "text-red-400" : budgetPct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
            <span>{Math.round(100 - budgetPct)}% remaining</span>
            <span>{formatCurrency(Math.max(0, totalBudget - totalSpent))} left</span>
          </div>
        </div>
      )}

      {/* Booking Status */}
      {pendingBookings.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="text-xs text-amber-400 font-medium">
            {pendingBookings.length} booking{pendingBookings.length > 1 ? "s" : ""} awaiting confirmation
          </div>
          <ChevronRight size={14} className="text-amber-400" />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Link
          href={`/dashboard/events/${event.id}`}
          className="flex-1 btn-primary text-xs py-2.5 justify-center"
        >
          Manage Event
          <ArrowRight size={13} />
        </Link>
        <Link
          href="/browse"
          className="flex-1 btn-secondary text-xs py-2.5 justify-center"
        >
          Find Vendors
        </Link>
      </div>
    </div>
  );
}
