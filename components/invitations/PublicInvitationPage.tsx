"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Clock, CheckCircle2, X, HelpCircle, Sparkles, ArrowRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { EVENT_TYPES } from "@/types";
import toast from "react-hot-toast";
import type { Invitation } from "@/types";

type TemplateTheme = {
  bg: string;
  accent: string;
  cardBg: string;
  border: string;
  headingClass: string;
  badge: string;
};

const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  classic: {
    bg: "bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1e] to-[#0a0a0f]",
    accent: "gradient-brand",
    cardBg: "glass-card",
    border: "border-white/10",
    headingClass: "gradient-brand-text",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/20",
  },
  elegant: {
    bg: "bg-gradient-to-br from-[#0f0a14] via-[#150f20] to-[#0f0a14]",
    accent: "bg-gradient-to-r from-purple-600 to-violet-600",
    cardBg: "glass-card",
    border: "border-purple-500/15",
    headingClass: "bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  },
  playful: {
    bg: "bg-gradient-to-br from-[#0a0f14] via-[#0f140a] to-[#14080f]",
    accent: "bg-gradient-to-r from-pink-500 to-orange-500",
    cardBg: "glass-card",
    border: "border-pink-500/15",
    headingClass: "bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent",
    badge: "bg-pink-500/15 text-pink-300 border-pink-500/20",
  },
  minimal: {
    bg: "bg-[#0d0d0d]",
    accent: "bg-white",
    cardBg: "glass-card",
    border: "border-white/8",
    headingClass: "text-white",
    badge: "bg-white/10 text-slate-300 border-white/15",
  },
  luxury: {
    bg: "bg-gradient-to-br from-[#0a0800] via-[#120f00] to-[#0a0800]",
    accent: "bg-gradient-to-r from-gold-500 to-gold-400",
    cardBg: "glass-card",
    border: "border-gold-500/20",
    headingClass: "gradient-gold-text",
    badge: "bg-gold-500/15 text-gold-400 border-gold-500/20",
  },
};

interface Props {
  invitation: Invitation & { event?: Record<string, unknown> };
  token: string;
}

type RSVPStep = "view" | "form" | "thanks";

const MEAL_OPTIONS = ["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Nut-free"];

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-white">{String(value).padStart(2, "0")}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function PublicInvitationPage({ invitation, token }: Props) {
  const [step, setStep]           = useState<RSVPStep>("view");
  const [status, setStatus]       = useState<"accepted" | "declined" | "tentative">("accepted");
  const [guestName, setGuestName] = useState("");
  const [email, setEmail]         = useState("");
  const [plusOne, setPlusOne]     = useState(false);
  const [meal, setMeal]           = useState("");
  const [message, setMessage]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const event = invitation.event as {
    title?: string; date?: string; start_time?: string; city?: string;
    venue_name?: string; venue_address?: string; event_type?: string; guest_count?: number; theme?: string;
  } | null;

  const theme = TEMPLATE_THEMES[invitation.template ?? "classic"] ?? TEMPLATE_THEMES.classic;
  const eventType = event?.event_type ? EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES] : null;
  const eventDate = event?.date ?? null;

  // Countdown timer
  useEffect(() => {
    if (!eventDate) return;
    function tick() {
      const now = Date.now();
      const target = new Date(eventDate!).getTime();
      const diff = Math.max(0, target - now);
      setCountdown({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  async function submitRSVP() {
    if (!guestName.trim()) { toast.error("Please enter your name"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_name: guestName, email, status, plus_one: plusOne, meal_preference: meal, message }),
      });
      if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error); }
      setStep("thanks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "thanks") {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", theme.bg)}>
        <div className="max-w-md w-full glass-card p-10 text-center animate-fade-in-up">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5",
            status === "accepted" ? "bg-emerald-500/20" : status === "declined" ? "bg-red-500/20" : "bg-blue-500/20"
          )}>
            {status === "accepted" ? <CheckCircle2 size={28} className="text-emerald-400" /> :
             status === "declined" ? <X size={28} className="text-red-400" /> :
             <HelpCircle size={28} className="text-blue-400" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {status === "accepted" ? "See you there!" :
             status === "declined" ? "Sorry you can't make it" :
             "Got it, thanks!"}
          </h2>
          <p className="text-slate-400 text-sm">
            {status === "accepted"
              ? `Your RSVP is confirmed${plusOne ? " (+ guest)" : ""}. We look forward to celebrating with you!`
              : status === "declined"
              ? "Thank you for letting us know. You'll be missed!"
              : "We hope to see you there! Feel free to reach out if your plans change."}
          </p>
          {event?.date && status === "accepted" && (
            <div className="mt-6 p-4 rounded-xl bg-white/4 border border-white/8">
              <div className="text-sm text-slate-400">
                <span className="font-semibold text-white">{event.title}</span>
                <br />{formatDate(event.date)}{event.start_time && ` at ${event.start_time}`}
                {event.city && <><br />{event.venue_name ?? event.city}</>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 sm:p-6", theme.bg)}>
      <div className="max-w-xl mx-auto space-y-5">

        {/* Cover / Hero */}
        <div className={cn("glass-card overflow-hidden animate-fade-in-up", theme.border)}>
          {invitation.cover_image_url ? (
            <div className="relative h-56 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={invitation.cover_image_url ?? undefined} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className={cn("h-48 flex items-center justify-center text-6xl relative overflow-hidden", theme.accent)}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              {eventType?.icon ?? "🎉"}
            </div>
          )}

          <div className="p-6">
            {eventType && (
              <div className={cn("inline-flex items-center gap-1.5 badge border mb-3", theme.badge)}>
                <span>{eventType.icon}</span>
                <span>{eventType.label}</span>
              </div>
            )}

            <h1 className={cn("text-2xl sm:text-3xl font-extrabold leading-tight mb-2", theme.headingClass)}>
              {invitation.title || event?.title || "You're Invited!"}
            </h1>

            {invitation.message && (
              <p className="text-slate-300 text-sm leading-relaxed mb-5">{invitation.message}</p>
            )}

            {/* Event Details */}
            <div className="space-y-2.5">
              {event?.date && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Calendar size={15} className="text-brand-400 flex-shrink-0" />
                  <span>{formatDate(event.date)}{event.start_time && ` at ${event.start_time}`}</span>
                </div>
              )}
              {(event?.venue_name || event?.city) && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <MapPin size={15} className="text-brand-400 flex-shrink-0" />
                  <span>{event.venue_name ?? event.city}{event.venue_name && event.city && `, ${event.city}`}</span>
                </div>
              )}
              {event?.guest_count && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Users size={15} className="text-brand-400 flex-shrink-0" />
                  <span>{event.guest_count} guests expected</span>
                </div>
              )}
              {invitation.dress_code && (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Sparkles size={15} className="text-brand-400 flex-shrink-0" />
                  <span>Dress code: <span className="font-semibold text-white">{invitation.dress_code}</span></span>
                </div>
              )}
              {invitation.rsvp_deadline && (
                <div className="flex items-center gap-2.5 text-sm text-amber-400">
                  <Clock size={15} className="flex-shrink-0" />
                  <span>RSVP by <span className="font-semibold">{formatDate(invitation.rsvp_deadline)}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown */}
        {event?.date && new Date(event.date) > new Date() && (
          <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">Event Countdown</p>
            <div className="flex justify-center gap-6">
              <CountdownUnit value={countdown.days}    label="Days" />
              <CountdownUnit value={countdown.hours}   label="Hours" />
              <CountdownUnit value={countdown.minutes} label="Mins" />
              <CountdownUnit value={countdown.seconds} label="Secs" />
            </div>
          </div>
        )}

        {/* RSVP Section */}
        {step === "view" && (
          <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-bold text-white mb-4 text-center">Will you be joining us?</h2>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(["accepted", "tentative", "declined"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setStep("form"); }}
                  className={cn(
                    "py-4 rounded-xl border font-semibold text-sm transition-all card-hover flex flex-col items-center gap-1.5",
                    s === "accepted"  ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" :
                    s === "declined"  ? "border-red-500/30 text-red-400 hover:bg-red-500/10" :
                                        "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  )}
                >
                  {s === "accepted"  ? <CheckCircle2 size={20} /> :
                   s === "declined"  ? <X size={20} /> :
                   <HelpCircle size={20} />}
                  {s === "accepted" ? "Yes, I'll be there!" :
                   s === "declined" ? "Sorry, can't make it" :
                   "Maybe"}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="glass-card p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Complete your RSVP</h2>
              <button onClick={() => setStep("view")} className="text-xs text-slate-500 hover:text-white transition-colors">
                Change response
              </button>
            </div>

            <div className={cn(
              "inline-flex items-center gap-2 badge border mb-5",
              status === "accepted"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              status === "declined"  ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                       "bg-blue-500/10 text-blue-400 border-blue-500/20"
            )}>
              {status === "accepted" ? <CheckCircle2 size={12} /> : status === "declined" ? <X size={12} /> : <HelpCircle size={12} />}
              {status === "accepted" ? "Attending" : status === "declined" ? "Not attending" : "Maybe attending"}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Your Name *</label>
                <input
                  className="input-field"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email (optional)</label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              {status === "accepted" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Meal Preference</label>
                    <select className="input-field" value={meal} onChange={(e) => setMeal(e.target.value)}>
                      <option value="">No preference</option>
                      {MEAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plusOne}
                      onChange={(e) => setPlusOne(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    <span className="text-sm text-slate-300">I will be bringing a plus one</span>
                  </label>
                </>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Message (optional)</label>
                <textarea
                  className="input-field resize-none h-20"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any message for the host..."
                />
              </div>
            </div>

            <button
              onClick={submitRSVP}
              disabled={submitting}
              className="btn-primary w-full mt-5 py-3"
            >
              {submitting ? "Submitting..." : "Submit RSVP"}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-700 pb-4">
          Powered by Bold Party Planner
        </p>
      </div>
    </div>
  );
}
