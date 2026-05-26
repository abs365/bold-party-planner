"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, Calendar, MapPin, Users,
  Palette, FileText, CheckCircle2, Home, Sun, Cloud,
  Send, Star, PartyPopper, Heart, Baby, GraduationCap,
  Briefcase, Gift, Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPES, VENDOR_CATEGORIES, type EventType, type VendorCategory, type AIEventPlan } from "@/types";
import toast from "react-hot-toast";

const EVENT_MOOD: Record<EventType, { gradient: string; emoji: string; headline: string; sub: string; icon: React.ElementType }> = {
  birthday:       { gradient: "from-pink-500 via-rose-500 to-orange-500",   emoji: "🎂", headline: "Let's plan the ultimate birthday!",    sub: "Balloons, music, and memories await",    icon: PartyPopper },
  wedding:        { gradient: "from-purple-500 via-pink-500 to-rose-400",   emoji: "💍", headline: "Your perfect day starts here",          sub: "Crafting once-in-a-lifetime moments",    icon: Heart },
  corporate:      { gradient: "from-blue-600 via-indigo-500 to-violet-600", emoji: "💼", headline: "Impress, connect, celebrate",           sub: "Professional events, perfectly executed", icon: Briefcase },
  baby_shower:    { gradient: "from-sky-400 via-cyan-400 to-teal-400",      emoji: "👶", headline: "Welcome a new little one",              sub: "Soft, sweet, and unforgettable",          icon: Baby },
  anniversary:    { gradient: "from-rose-500 via-red-400 to-pink-400",      emoji: "💕", headline: "Celebrate your love story",             sub: "Years of memories, one perfect night",   icon: Heart },
  graduation:     { gradient: "from-amber-500 via-yellow-400 to-lime-400",  emoji: "🎓", headline: "You earned this celebration!",          sub: "Mark the milestone in style",            icon: GraduationCap },
  naming_ceremony:{ gradient: "from-teal-400 via-emerald-400 to-green-400", emoji: "🌟", headline: "Celebrate a beautiful beginning",       sub: "A ceremony full of love and joy",        icon: Star },
  funeral:        { gradient: "from-slate-500 via-gray-500 to-zinc-500",    emoji: "🌹", headline: "A dignified, heartfelt farewell",       sub: "Handled with care and respect",          icon: Heart },
  charity:        { gradient: "from-emerald-500 via-teal-500 to-cyan-500",  emoji: "❤️", headline: "Make a difference, together",           sub: "Events that inspire and give back",      icon: Heart },
  conference:     { gradient: "from-indigo-600 via-blue-500 to-cyan-500",   emoji: "📋", headline: "Ideas that move the world forward",     sub: "Seamless, professional, impactful",      icon: Briefcase },
  engagement:     { gradient: "from-violet-500 via-purple-500 to-fuchsia-500", emoji: "💎", headline: "Say yes to the perfect party!",    sub: "The first celebration of forever",       icon: Gift },
  gender_reveal:  { gradient: "from-pink-400 via-purple-400 to-blue-400",   emoji: "🎉", headline: "Pink or blue — let's celebrate you!",  sub: "A surprise moment everyone will love",  icon: PartyPopper },
  other:          { gradient: "from-brand-500 via-purple-500 to-indigo-500", emoji: "✨", headline: "Every event is worth celebrating",     sub: "Let's make it extraordinary",           icon: Music2 },
};

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
  { label: "Analysing your event type...",       icon: "🎯" },
  { label: "Calculating budget breakdown...",    icon: "💷" },
  { label: "Curating vendor recommendations...", icon: "🤝" },
  { label: "Building your timeline...",          icon: "📅" },
  { label: "Finalising your Smart Plan...",      icon: "✨" },
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
  const [, setRfqCount] = useState(0);
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

  const mood = EVENT_MOOD[data.event_type];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Dynamic event mood banner */}
      <div className={cn(
        "relative rounded-2xl p-6 mb-8 overflow-hidden transition-all duration-700",
        `bg-gradient-to-r ${mood.gradient} opacity-90`
      )}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Smart Planner</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {mood.headline}
            </h1>
            <p className="text-white/70 text-sm mt-1">{mood.sub}</p>
          </div>
          <div className="text-5xl sm:text-6xl flex-shrink-0 ml-4 drop-shadow-lg">
            {mood.emoji}
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative z-10 mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
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
                {/* Premium animated icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full gradient-brand opacity-15 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-2 rounded-full gradient-brand opacity-25 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
                  <div className="relative w-24 h-24 rounded-2xl gradient-brand flex items-center justify-center shadow-2xl shadow-brand-500/50">
                    <Sparkles size={36} className="text-white drop-shadow-lg" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-1">Building Your Smart Plan</h3>
                <p className="text-brand-400 text-sm font-medium mb-8">Personalised for your {EVENT_TYPES[data.event_type]?.label ?? "event"} · Usually under 15 seconds</p>

                {/* Animated step list */}
                <div className="space-y-2.5 max-w-sm mx-auto text-left">
                  {LOADING_STEPS.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-500",
                        i < loadingStep ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" :
                        i === loadingStep ? "bg-brand-500/15 border border-brand-500/30 text-white shadow-lg shadow-brand-500/10" :
                        "bg-white/3 border border-white/5 text-slate-600"
                      )}
                    >
                      <span className="text-base flex-shrink-0">
                        {i < loadingStep ? "✅" : i === loadingStep ? item.icon : "⬜"}
                      </span>
                      {i === loadingStep && <Loader2 size={14} className="animate-spin text-brand-400 flex-shrink-0 -ml-1" />}
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {aiPlan ? (
                  <div className="space-y-5">
                    {/* Plan ready header */}
                    <div className={cn(
                      "relative rounded-2xl p-5 overflow-hidden",
                      `bg-gradient-to-r ${mood.gradient} opacity-95`
                    )}>
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-white" />
                          <span className="text-white font-bold text-sm uppercase tracking-wide">Smart Plan Ready</span>
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed">{aiPlan.summary}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <span className="text-white/80 text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full">
                            {EVENT_TYPES[data.event_type]?.icon} {EVENT_TYPES[data.event_type]?.label}
                          </span>
                          <span className="text-white/80 text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full">
                            👥 {data.guest_count} guests
                          </span>
                          <span className="text-white/80 text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full">
                            💷 £{data.budget.toLocaleString()} budget
                          </span>
                          {data.city && (
                            <span className="text-white/80 text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full">
                              📍 {data.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Budget breakdown */}
                    {aiPlan.budget_breakdown?.length > 0 && (
                      <div className="glass-card p-4">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          <span>💷</span> Budget Breakdown
                        </h4>
                        <div className="space-y-2.5">
                          {aiPlan.budget_breakdown.slice(0, 5).map((item) => (
                            <div key={item.category} className="flex items-center justify-between text-sm gap-3">
                              <span className="text-slate-400 min-w-0 truncate flex-1">{item.category}</span>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="w-20 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                  <div
                                    className="h-full gradient-brand rounded-full transition-all duration-1000"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="text-white font-semibold w-16 text-right tabular-nums">£{item.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vendors needed — premium cards */}
                    {aiPlan.vendors_needed?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          <span>🤝</span> Recommended Vendors
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {aiPlan.vendors_needed.slice(0, 6).map((v) => {
                            const cat = VENDOR_CATEGORIES[v.category as VendorCategory];
                            const isEssential = v.priority === "essential";
                            return (
                              <div key={v.category} className={cn(
                                "flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all",
                                isEssential
                                  ? "border-brand-500/40 bg-brand-500/10 shadow-sm shadow-brand-500/10"
                                  : v.priority === "recommended"
                                    ? "border-white/12 bg-white/4"
                                    : "border-white/6 bg-white/2"
                              )}>
                                <span className="text-xl flex-shrink-0">{cat?.icon ?? "🎯"}</span>
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-white text-sm block truncate">{cat?.label ?? v.category}</span>
                                  <span className={cn("text-xs", isEssential ? "text-brand-400" : "text-slate-500")}>
                                    {isEssential ? "⭐ Essential" : v.priority === "recommended" ? "Recommended" : "Optional"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Top tips */}
                    {aiPlan.tips?.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">💡 Smart Tips</h4>
                        <ul className="space-y-1">
                          {aiPlan.tips.slice(0, 2).map((tip, i) => (
                            <li key={i} className="text-slate-400 text-xs leading-relaxed">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* RFQ summary if vendor needs selected */}
                    {data.vendor_needs.length > 0 && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-1">
                          <Send size={13} />
                          Quote Requests Ready to Send
                        </div>
                        <p className="text-slate-400 text-sm">
                          We&apos;ll contact up to <strong className="text-white">{data.vendor_needs.length * 3} vendors</strong> across {data.vendor_needs.length} categor{data.vendor_needs.length === 1 ? "y" : "ies"} the moment you create your event. Most vendors respond within 24 hours.
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
