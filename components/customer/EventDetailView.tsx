"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar, MapPin, Users, DollarSign, Sparkles, CheckCircle2,
  Circle, Clock, AlertTriangle, ShoppingBag,
  TrendingUp, Edit2, Store, ChevronDown, ChevronUp, Mail, UserCheck,
} from "lucide-react";
import { cn, formatCurrency, formatDate, daysUntilEvent } from "@/lib/utils";
import { VENDOR_CATEGORIES, EVENT_TYPES, type Event, type AIEventPlan } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SmartRecommendationsPanel } from "@/components/smart/SmartRecommendationsPanel";
import toast from "react-hot-toast";

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  completed: boolean;
}

interface EventDetailViewProps {
  event: Event;
  bookings: Array<Record<string, unknown>>;
  checklist: ChecklistItem[];
}

export function EventDetailView({ event, bookings, checklist: initialChecklist }: EventDetailViewProps) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const aiPlan = event.ai_plan as AIEventPlan | null;
  const daysLeft = daysUntilEvent(event.date);
  const eventType = EVENT_TYPES[event.event_type];

  const confirmedBookings = bookings.filter((b) => ["accepted", "confirmed", "completed"].includes(String(b.status)));
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const totalBooked = bookings.reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
  const budgetUsed = Math.min((totalBooked / event.budget) * 100, 100);

  const completedItems = checklist.filter((c) => c.completed).length;
  const checklistProgress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

  // Group checklist by category
  const checklistGroups = checklist.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  }

  async function toggleChecklistItem(itemId: string, current: boolean) {
    setChecklist((prev) => prev.map((c) => c.id === itemId ? { ...c, completed: !current } : c));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("checklist_progress")
        .update({ completed: !current, completed_at: !current ? new Date().toISOString() : null })
        .eq("id", itemId);
    } catch {
      setChecklist((prev) => prev.map((c) => c.id === itemId ? { ...c, completed: current } : c));
      toast.error("Failed to update");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-brand-400 mb-1">
            <span>{eventType?.icon}</span>
            <span>{eventType?.label}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-400" />
              {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-brand-400" />
              {event.city}{event.venue_name && ` · ${event.venue_name}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-brand-400" />
              {event.guest_count} guests
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={event.status} />
          <Link href={`/dashboard/events/${event.id}/guests`} className="btn-secondary text-xs py-2 px-3">
            <UserCheck size={13} />Guests
          </Link>
          <Link href={`/dashboard/events/${event.id}/invitations`} className="btn-secondary text-xs py-2 px-3">
            <Mail size={13} />Invitations
          </Link>
          <Link href={`/dashboard/events/${event.id}/edit`} className="btn-secondary text-xs py-2 px-3">
            <Edit2 size={13} />Edit
          </Link>
        </div>
      </div>

      {/* Days Counter */}
      {daysLeft >= 0 && (
        <div className={cn(
          "bg-white/4 border rounded-xl p-4 flex items-center gap-4",
          daysLeft <= 7 ? "border-amber-500/30" : daysLeft <= 30 ? "border-blue-500/20" : "border-white/6"
        )}>
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0",
            daysLeft === 0 ? "gradient-brand text-white" :
            daysLeft <= 7 ? "bg-amber-500/20 text-amber-400" :
            "bg-brand-500/15 text-brand-400"
          )}>
            {daysLeft === 0 ? "🎉" : daysLeft}
          </div>
          <div>
            <div className="font-bold text-white">
              {daysLeft === 0 ? "Event is Today!" :
               daysLeft === 1 ? "Event is Tomorrow!" :
               `${daysLeft} days until your event`}
            </div>
            <div className="text-sm text-slate-400">{formatDate(event.date)}{event.start_time && ` at ${event.start_time}`}</div>
          </div>
          {daysLeft <= 7 && daysLeft > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
              <AlertTriangle size={15} />
              Final Countdown!
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Checklist + Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-slate-400" />
                  Event Checklist
                </h3>
                <div className="text-sm text-slate-400">
                  <span className="text-white font-semibold">{completedItems}</span>/{checklist.length} done
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div
                    className="gradient-brand h-2 rounded-full transition-all duration-500"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{Math.round(checklistProgress)}% complete</div>
              </div>

              <div className="space-y-3">
                {Object.entries(checklistGroups).map(([category, items]) => {
                  const catDone = items.filter((i) => i.completed).length;
                  const isExpanded = expandedCategories.has(category) || catDone < items.length;
                  return (
                    <div key={category} className="border border-white/8 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{category}</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            catDone === items.length ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 text-slate-400"
                          )}>
                            {catDone}/{items.length}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-white/8 divide-y divide-white/5">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => toggleChecklistItem(item.id, item.completed)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors text-left group"
                            >
                              {item.completed ? (
                                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Circle size={16} className="text-slate-600 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
                              )}
                              <span className={cn(
                                "text-sm transition-colors",
                                item.completed ? "line-through text-slate-600" : "text-slate-300"
                              )}>
                                {item.item}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bookings */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingBag size={17} className="text-slate-400" />
                Vendor Bookings ({bookings.length})
              </h3>
              <Link
                href={`/browse?event=${event.id}`}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <Store size={13} />
                Add Vendor
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag size={32} className="mx-auto mb-3 text-slate-700" />
                <p className="text-slate-400 text-sm mb-4">No vendors booked yet</p>
                <Link href="/browse" className="btn-primary text-sm py-2.5 px-5">
                  <Store size={14} />Browse Vendors
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const vendor = booking.vendor as Record<string, unknown>;
                  const pkg = booking.package as Record<string, unknown> | null;
                  const vendorMedia = (vendor?.media as Array<Record<string, string>>)?.[0];
                  const cat = VENDOR_CATEGORIES[String(vendor?.category ?? "") as keyof typeof VENDOR_CATEGORIES];
                  return (
                    <Link
                      key={String(booking.id)}
                      href={`/dashboard/bookings/${booking.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/4 hover:bg-white/6 border border-white/8 hover:border-brand-500/20 transition-all group"
                    >
                      {vendorMedia ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <Image src={vendorMedia.url} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                          {cat?.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm group-hover:text-brand-400 transition-colors">
                          {String(vendor?.business_name ?? "Vendor")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {cat?.label}{pkg && ` · ${pkg.name}`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{formatCurrency(Number(booking.total_amount))}</div>
                        <StatusBadge status={String(booking.status)} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Smart Timeline */}
          {aiPlan?.timeline && aiPlan.timeline.length > 0 && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={17} className="text-slate-400" />
                Event Timeline
              </h3>
              <div className="space-y-3">
                {aiPlan.timeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
                      {i < aiPlan.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-white/10 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="text-xs font-semibold text-brand-400">{item.time}</div>
                      <div className="text-sm text-slate-300 mt-0.5">{item.task}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Tips & Risks */}
          {aiPlan?.risks && aiPlan.risks.length > 0 && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-400" />
                Risks to Watch
              </h3>
              <ul className="space-y-2">
                {aiPlan.risks.map((risk, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-400">
                    <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Stats + Smart Plan Summary */}
        <div className="space-y-5">
          {/* Budget Card */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-slate-400" />Budget
            </h3>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Spent</span>
                <span className="text-white font-semibold">{formatCurrency(totalBooked)}</span>
              </div>
              <div className="bg-white/5 rounded-full h-2.5">
                <div
                  className={cn("h-2.5 rounded-full transition-all", budgetUsed > 90 ? "bg-red-500" : "gradient-brand")}
                  style={{ width: `${budgetUsed}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-600">{Math.round(budgetUsed)}% used</span>
                <span className="text-slate-400">Budget: {formatCurrency(event.budget)}</span>
              </div>
            </div>
            <div className="border-t border-white/8 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Remaining</span>
                <span className={cn("font-semibold", totalBooked > event.budget ? "text-red-400" : "text-emerald-400")}>
                  {formatCurrency(Math.max(event.budget - totalBooked, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Budget Breakdown */}
          {aiPlan?.budget_breakdown && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-slate-400" />Smart Budget Estimate
              </h3>
              <div className="space-y-2">
                {aiPlan.budget_breakdown.slice(0, 7).map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{item.category}</span>
                      <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-1.5">
                      <div
                        className="gradient-brand h-1.5 rounded-full"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />Summary
            </h3>
            <div className="space-y-3">
              {[
                { label: "Confirmed vendors", value: confirmedBookings.length, color: "text-emerald-400" },
                { label: "Pending bookings", value: pendingBookings.length, color: "text-amber-400" },
                { label: "Checklist progress", value: `${Math.round(checklistProgress)}%`, color: "text-brand-400" },
                { label: "Budget used", value: `${Math.round(budgetUsed)}%`, color: budgetUsed > 90 ? "text-red-400" : "text-white" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className={cn("text-sm font-semibold", color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Vendor Suggestions */}
          {aiPlan?.vendors_needed && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-slate-400" />Recommended Vendors
              </h3>
              <div className="space-y-2">
                {aiPlan.vendors_needed.slice(0, 6).map((v, i) => {
                  const cat = VENDOR_CATEGORIES[v.category];
                  const isBooked = bookings.some((b) => String((b.vendor as Record<string, unknown>)?.category) === v.category);
                  return (
                    <div key={i} className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg",
                      isBooked ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/4 border border-white/8"
                    )}>
                      <span className="text-base">{cat?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{cat?.label}</div>
                        <div className="text-xs text-slate-600 capitalize">{v.priority}</div>
                      </div>
                      {isBooked ? (
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Link href={`/browse?category=${v.category}`} className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0">
                          Book →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Smart Recommendations Panel */}
      <SmartRecommendationsPanel
        eventId={event.id}
        eventType={event.event_type}
        guestCount={event.guest_count}
        budget={event.budget}
        city={event.city}
        existingCategories={[...new Set(bookings.map((b) => String(b.vendor_category ?? b.category ?? "")).filter(Boolean))]}
      />
    </div>
  );
}
