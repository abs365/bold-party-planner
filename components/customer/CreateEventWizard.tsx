"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, Calendar, MapPin, Users,
  Palette, FileText, CheckCircle2, Zap, Home, Sun, Cloud,
  Send, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPES, VENDOR_CATEGORIES, type EventType, type VendorCategory, type AIEventPlan } from "@/types";
import toast from "react-hot-toast";

interface WizardData {
  title: string;
  event_type: EventType;
  date: string;
  start_time: string;
  city: string;
  postcode: string;
  venue_name: string;
  setting: "indoor" | "outdoor" | "both";
  guest_count: number;
  budget: number;
  theme: string;
  notes: string;
  vendor_needs: VendorCategory[];
}

const STEPS = [
  { id: 1, label: "Event Type", icon: "🎉" },
  { id: 2, label: "Details", icon: "📋" },
  { id: 3, label: "Budget", icon: "💷" },
  { id: 4, label: "Vendors", icon: "🤝" },
  { id: 5, label: "Smart Plan", icon: "✨" },
];

const LOADING_STEPS = [
  "Analysing your event type...",
  "Calculating budget breakdown...",
  "Curating vendor recommendations...",
  "Building your timeline...",
  "Finalising your Smart Plan...",
];

const BUDGETS = [
  { label: "Under £1,000", min: 0, max: 1000 },
  { label: "£1,000–2,500", min: 1000, max: 2500 },
  { label: "£2,500–5,000", min: 2500, max: 5000 },
  { label: "£5,000–10,000", min: 5000, max: 10000 },
  { label: "£10,000–20,000", min: 10000, max: 20000 },
  { label: "£20,000+", min: 20000, max: 50000 },
];

const SETTING_OPTIONS = [
  { value: "indoor" as const, label: "Indoor", icon: Home, desc: "Hall, venue, hotel" },
  { value: "outdoor" as const, label: "Outdoor", icon: Sun, desc: "Garden, park, marquee" },
  { value: "both" as const, label: "Both", icon: Cloud, desc: "Indoor + outdoor" },
];

// Popular vendor categories for quick selection
const POPULAR_VENDOR_NEEDS: { category: VendorCategory; label: string; icon: string; popular?: boolean }[] = [
  { category: "dj", label: "DJ / Music", icon: "🎧", popular: true },
  { category: "photographer", label: "Photography", icon: "📸", popular: true },
  { category: "videographer", label: "Videography", icon: "🎥" },
  { category: "caterer", label: "Catering", icon: "🍽️", popular: true },
  { category: "decorator", label: "Decoration", icon: "🎨", popular: true },
  { category: "mc", label: "MC / Host", icon: "🎤" },
  { category: "cake_maker", label: "Cake", icon: "🎂" },
  { category: "live_band", label: "Live Band", icon: "🎸" },
  { category: "balloon_decorator", label: "Balloons", icon: "🎈" },
  { category: "lighting_stage", label: "Lighting", icon: "💡" },
  { category: "makeup_artist", label: "Makeup", icon: "💄" },
  { category: "transport", label: "Transport", icon: "🚗" },
  { category: "security", label: "Security", icon: "🛡️" },
  { category: "marquee_rental", label: "Marquee", icon: "⛺" },
  { category: "furniture_rental", label: "Furniture", icon: "🪑" },
  { category: "event_staff", label: "Event Staff", icon: "👔" },
];

export function CreateEventWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    title: "",
    event_type: "birthday",
    date: "",
    start_time: "",
    city: "",
    postcode: "",
    venue_name: "",
    setting: "indoor",
    guest_count: 50,
    budget: 2500,
    theme: "",
    notes: "",
    vendor_needs: [],
  });
  const [aiPlan, setAiPlan] = useState<AIEventPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [rfqCount, setRfqCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!generatingPlan) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1400);
    return () => {
      clearInterval(interval);
      setLoadingStep(0);
    };
  }, [generatingPlan]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleVendorNeed(category: VendorCategory) {
    setData((prev) => ({
      ...prev,
      vendor_needs: prev.vendor_needs.includes(category)
        ? prev.vendor_needs.filter((c) => c !== category)
        : [...prev.vendor_needs, category],
    }));
  }

  async function generateAIPlan() {
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/smart-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: data.event_type,
          guestCount: data.guest_count,
          budget: data.budget,
          city: data.city,
          theme: data.theme,
          notes: data.notes,
          date: data.date,
          vendorNeeds: data.vendor_needs,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const plan = await res.json();
      setAiPlan(plan);
      toast.success("Your Smart Plan is ready!");
    } catch {
      toast.error("Could not generate your plan. You can still create the event.");
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function handleNext() {
    if (step === 1 && !data.title) {
      toast.error("Please enter an event title");
      return;
    }
    if (step === 2 && !data.date) {
      toast.error("Please select an event date");
      return;
    }
    if (step === 2 && !data.city) {
      toast.error("Please enter your city");
      return;
    }
    if (step === 4) {
      setStep(5);
      generateAIPlan();
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleCreate() {
    if (!data.title || !data.date || !data.city) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Create the event
      const { data: event, error } = await supabase
        .from("events")
        .insert({
          customer_id: userId,
          title: data.title,
          event_type: data.event_type,
          date: data.date,
          start_time: data.start_time || null,
          city: data.city,
          venue_name: data.venue_name || null,
          venue_address: data.postcode ? `${data.venue_name ?? ""}, ${data.postcode}`.trim() : null,
          guest_count: data.guest_count,
          budget: data.budget,
          theme: data.theme || null,
          notes: data.notes || null,
          status: "planning",
          ai_plan: aiPlan,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-generate RFQ quotes for selected vendor needs
      let quotesCreated = 0;
      if (data.vendor_needs.length > 0) {
        const rfqResults = await Promise.allSettled(
          data.vendor_needs.map(async (category) => {
            const { data: topVendors } = await supabase
              .from("vendors")
              .select("id")
              .eq("category", category)
              .eq("status", "approved")
              .ilike("city", `%${data.city}%`)
              .order("rating", { ascending: false })
              .limit(3);

            if (!topVendors?.length) {
              // Fallback: find vendors anywhere if none in city
              const { data: anyVendors } = await supabase
                .from("vendors")
                .select("id")
                .eq("category", category)
                .eq("status", "approved")
                .order("rating", { ascending: false })
                .limit(3);
              if (!anyVendors?.length) return 0;

              const catLabel = VENDOR_CATEGORIES[category]?.label ?? category;
              const inserts = anyVendors.map((v) => ({
                customer_id: userId,
                vendor_id: v.id,
                event_id: event.id,
                status: "pending",
                message: `Hi, I'm planning a ${EVENT_TYPES[data.event_type]?.label ?? data.event_type} called "${data.title}" for approximately ${data.guest_count} guests on ${data.date} in ${data.city}. My budget is around £${data.budget.toLocaleString()}. I'm looking for a ${catLabel} — could you share your availability and pricing? Thank you!`,
                event_date: data.date,
                event_type: data.event_type,
                guest_count: data.guest_count,
                budget_min: Math.floor(data.budget * 0.15),
                budget_max: Math.floor(data.budget * 0.35),
              }));
              await supabase.from("quotes").insert(inserts);
              return anyVendors.length;
            }

            const catLabel = VENDOR_CATEGORIES[category]?.label ?? category;
            const inserts = topVendors.map((v) => ({
              customer_id: userId,
              vendor_id: v.id,
              event_id: event.id,
              status: "pending",
              message: `Hi, I'm planning a ${EVENT_TYPES[data.event_type]?.label ?? data.event_type} called "${data.title}" for approximately ${data.guest_count} guests on ${data.date} in ${data.city}. My budget is around £${data.budget.toLocaleString()}. I'm looking for a ${catLabel} — could you share your availability and pricing? Thank you!`,
              event_date: data.date,
              event_type: data.event_type,
              guest_count: data.guest_count,
              budget_min: Math.floor(data.budget * 0.15),
              budget_max: Math.floor(data.budget * 0.35),
            }));
            await supabase.from("quotes").insert(inserts);
            return topVendors.length;
          })
        );

        quotesCreated = rfqResults
          .filter((r): r is PromiseFulfilledResult<number> => r.status === "fulfilled")
          .reduce((sum, r) => sum + r.value, 0);
        setRfqCount(quotesCreated);
      }

      if (quotesCreated > 0) {
        toast.success(`Event created! Quote requests sent to ${quotesCreated} vendors.`);
      } else {
        toast.success("Event created successfully!");
      }
      router.push(`/dashboard/events/${event.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Plan a New Event</h1>
        <p className="text-slate-400 text-sm">Our Smart Planner builds a complete plan and sends quote requests to vetted vendors automatically.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                step === s.id ? "gradient-brand text-white shadow-lg" :
                step > s.id ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/30" :
                "bg-white/5 text-slate-500 cursor-default"
              )}
            >
              <span>{step > s.id ? "✓" : s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("w-4 h-px flex-shrink-0", step > s.id ? "bg-emerald-500/40" : "bg-white/10")} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-6 sm:p-8">
        {/* ── STEP 1: Event Type ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Event Title *</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Emma's 30th Birthday, Sarah & Tom's Wedding"
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-3">What type of event? *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(EVENT_TYPES).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update("event_type", key as EventType)}
                    className={cn(
                      "flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium text-left transition-all",
                      data.event_type === key
                        ? "bg-brand-500/20 border border-brand-500/40 text-brand-300"
                        : "bg-white/4 border border-white/8 text-slate-400 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <span className="text-xl">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">
                  <Calendar size={13} className="inline mr-1.5 text-brand-400" />Event Date *
                </label>
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => update("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={data.start_time}
                  onChange={(e) => update("start_time", e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">
                  <MapPin size={13} className="inline mr-1.5 text-brand-400" />City *
                </label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="e.g. London, Manchester"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Postcode</label>
                <input
                  type="text"
                  value={data.postcode}
                  onChange={(e) => update("postcode", e.target.value.toUpperCase())}
                  placeholder="e.g. SW1A 1AA"
                  className="input-field"
                  maxLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Venue Name</label>
              <input
                type="text"
                value={data.venue_name}
                onChange={(e) => update("venue_name", e.target.value)}
                placeholder="e.g. The Grand Ballroom, Our Home, TBC"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Venue Setting</label>
              <div className="grid grid-cols-3 gap-3">
                {SETTING_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update("setting", value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all",
                      data.setting === value
                        ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                        : "bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <Icon size={22} />
                    <span>{label}</span>
                    <span className="text-xs text-slate-500 font-normal">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">
                <Palette size={13} className="inline mr-1.5 text-brand-400" />Theme / Style
              </label>
              <input
                type="text"
                value={data.theme}
                onChange={(e) => update("theme", e.target.value)}
                placeholder="e.g. Black & Gold, Rustic, Tropical, Formal, Boho"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Guests & Budget ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                <Users size={14} className="inline mr-1.5 text-brand-400" />Guest Count
              </label>
              <div className="flex items-center gap-4 mb-2">
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={data.guest_count}
                  onChange={(e) => update("guest_count", Number(e.target.value))}
                  className="flex-1 accent-brand-500"
                />
                <div className="w-20 text-center glass px-3 py-2 rounded-lg text-white font-bold text-lg">
                  {data.guest_count}
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>10</span><span>100</span><span>200</span><span>300</span><span>500</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Total Budget *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                {BUDGETS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => update("budget", b.max)}
                    className={cn(
                      "p-3.5 rounded-xl text-sm font-semibold text-center transition-all",
                      data.budget === b.max
                        ? "bg-brand-500/20 border border-brand-500/40 text-brand-300"
                        : "bg-white/4 border border-white/8 text-slate-400 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Or enter exact amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">£</span>
                  <input
                    type="number"
                    value={data.budget || ""}
                    onChange={(e) => update("budget", Number(e.target.value))}
                    min={100}
                    className="input-field pl-8"
                    placeholder="e.g. 3500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">
                <FileText size={13} className="inline mr-1.5 text-brand-400" />Additional Notes
              </label>
              <textarea
                value={data.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Special requirements, dietary needs, accessibility, cultural considerations, specific ideas..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Vendor Needs ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <p className="text-slate-400 text-sm mb-4">
                Select the services you need. We&apos;ll automatically send quote requests to the top-rated vendors in each category near <strong className="text-white">{data.city}</strong>.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {POPULAR_VENDOR_NEEDS.map(({ category, label, icon, popular }) => {
                  const selected = data.vendor_needs.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleVendorNeed(category)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all",
                        selected
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                          : "bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      {popular && !selected && (
                        <span className="absolute -top-1.5 -right-1.5 text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                          Popular
                        </span>
                      )}
                      {selected && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" />
                        </span>
                      )}
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs text-center leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {data.vendor_needs.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                  <Send size={13} />
                  Auto-RFQ Preview
                </div>
                <p className="text-slate-400 text-sm">
                  We&apos;ll send quote requests to up to <strong className="text-white">{data.vendor_needs.length * 3} vendors</strong> across {data.vendor_needs.length} categor{data.vendor_needs.length === 1 ? "y" : "ies"} — {data.vendor_needs.map((c) => VENDOR_CATEGORIES[c]?.label ?? c).join(", ")}. Vendors typically respond within 24 hours.
                </p>
              </div>
            )}

            {data.vendor_needs.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-2">
                Skip this step if you haven&apos;t decided yet — you can request quotes individually from vendor profiles.
              </p>
            )}
          </div>
        )}

        {/* ── STEP 5: Smart Plan ── */}
        {step === 5 && (
          <div className="space-y-6">
            {generatingPlan ? (
              <div className="text-center py-10">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full gradient-brand opacity-20 animate-ping" />
                  <div className="relative w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center shadow-xl shadow-brand-500/40">
                    <Sparkles size={32} className="text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Building Your Smart Plan</h3>
                <p className="text-slate-500 text-sm mb-8">Powered by AI · Takes about 15 seconds</p>
                <div className="space-y-3 max-w-xs mx-auto text-left">
                  {LOADING_STEPS.map((label, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-3 text-sm transition-all duration-500",
                      i < loadingStep ? "text-emerald-400" :
                      i === loadingStep ? "text-white" : "text-slate-600"
                    )}>
                      {i < loadingStep ? (
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      ) : i === loadingStep ? (
                        <Loader2 size={16} className="animate-spin text-brand-400 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {aiPlan ? (
                  <div className="space-y-5">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-brand-500/8 border border-brand-500/20">
                      <div className="flex items-center gap-2 text-brand-400 text-sm font-semibold mb-2">
                        <Sparkles size={14} />
                        Smart Plan Summary
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{aiPlan.summary}</p>
                    </div>

                    {/* Budget breakdown */}
                    {aiPlan.budget_breakdown?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Budget Breakdown</h4>
                        <div className="space-y-2">
                          {aiPlan.budget_breakdown.slice(0, 5).map((item) => (
                            <div key={item.category} className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">{item.category}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full gradient-brand rounded-full" style={{ width: `${item.percentage}%` }} />
                                </div>
                                <span className="text-white font-medium w-16 text-right">£{item.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vendors needed */}
                    {aiPlan.vendors_needed?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Recommended Vendors</h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {aiPlan.vendors_needed.slice(0, 6).map((v) => {
                            const cat = VENDOR_CATEGORIES[v.category as VendorCategory];
                            return (
                              <div key={v.category} className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
                                v.priority === "essential" ? "border-brand-500/30 bg-brand-500/8" :
                                v.priority === "recommended" ? "border-white/10 bg-white/4" :
                                "border-white/6 bg-white/2"
                              )}>
                                <span>{cat?.icon ?? "🎯"}</span>
                                <div>
                                  <span className="font-medium text-white">{cat?.label ?? v.category}</span>
                                  <span className={cn("ml-1.5 text-xs", v.priority === "essential" ? "text-brand-400" : "text-slate-500")}>
                                    {v.priority}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* RFQ summary if vendor needs selected */}
                    {data.vendor_needs.length > 0 && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                          <Send size={13} />
                          Quote Requests Ready to Send
                        </div>
                        <p className="text-slate-400 text-sm">
                          Clicking &quot;Create Event&quot; will automatically send quote requests to up to <strong className="text-white">{data.vendor_needs.length * 3} vendors</strong>. Check your Quotes section to track responses.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={28} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Plan generation skipped</h3>
                    <p className="text-slate-400 text-sm mb-4">You can still create your event and we&apos;ll send the quote requests.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
          <button
            onClick={() => step > 1 && setStep((s) => s - 1)}
            disabled={step === 1}
            className="btn-secondary py-2.5 px-5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            {STEPS.map((s) => (
              <div key={s.id} className={cn("w-1.5 h-1.5 rounded-full transition-all", step === s.id ? "bg-brand-400 w-3" : step > s.id ? "bg-emerald-500/50" : "bg-white/15")} />
            ))}
          </div>

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={generatingPlan}
              className="btn-primary py-2.5 px-5 flex items-center gap-2"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving || generatingPlan}
              className="btn-primary py-2.5 px-6 flex items-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
              {saving ? "Creating..." : data.vendor_needs.length > 0 ? "Create & Send Quotes" : "Create Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
