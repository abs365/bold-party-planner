import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InspirationPreview } from "@/components/ui/InspirationFeed";
import { LiveActivityWidget } from "@/components/ui/TrendingVendors";
import {
  Sparkles, ArrowRight, Star, CheckCircle2, Zap, Shield, Users, Calendar,
  Music2, Camera, Utensils, Mic2, Palette, Car, Cake,
  Quote, TrendingUp, Lock, Clock, Award, MapPin, Heart, Compass,
} from "lucide-react";
import { VENDOR_CATEGORIES, EVENT_TYPES } from "@/types";
import type { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "Bold Party — Plan, Book & Celebrate | UK Event Marketplace",
  description: "The UK's most trusted event marketplace. Book verified DJs, photographers, caterers, decorators and 15 more vendor categories. Smart planning tools included. Start free.",
  openGraph: {
    title: "Bold Party — Plan, Book & Celebrate",
    description: "Book verified UK event vendors. Smart planning, secure payments, guaranteed experience.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const STATS = [
  { value: "500+", label: "Verified Vendors" },
  { value: "2,400+", label: "Events Planned" },
  { value: "4.9★", label: "Average Rating" },
  { value: "98%", label: "Happy Customers" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Smart Event Planner",
    desc: "Tell us your event type, budget, and guest count. Our Smart Planner builds a complete plan with vendors, timeline, and budget breakdown in seconds.",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: Users,
    title: "Verified Vendors Only",
    desc: "Every vendor is manually vetted and approved by our team. Browse real portfolio photos, verified reviews, and clear pricing before committing.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Shield,
    title: "Secure & Protected",
    desc: "Stripe-powered payments with deposit protection. Digital contracts, automated invoices, and a full dispute resolution team behind every booking.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Calendar,
    title: "Full Coordination",
    desc: "From booking to event day, everything is tracked automatically. Smart reminders, vendor checklists, and real-time updates keep you in control.",
    color: "from-amber-500 to-orange-600",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create Your Event", desc: "Enter your event type, date, guest count, budget and theme. Our Smart Planner instantly generates a tailored event plan." },
  { step: "02", title: "Browse & Book", desc: "Browse verified vendors with real photos and videos. Compare packages, request quotes, and book instantly with one click." },
  { step: "03", title: "Pay Securely", desc: "Pay your 30% deposit via Stripe. Invoices generated automatically. Your money is fully protected until your event." },
  { step: "04", title: "Celebrate!", desc: "We handle all reminders, contracts, and vendor coordination so you can focus on enjoying your perfect day." },
];

const TOP_CATEGORIES = [
  { category: "dj" as const, icon: Music2, color: "from-purple-500 to-pink-500" },
  { category: "photographer" as const, icon: Camera, color: "from-blue-500 to-cyan-500" },
  { category: "caterer" as const, icon: Utensils, color: "from-amber-500 to-orange-500" },
  { category: "mc" as const, icon: Mic2, color: "from-emerald-500 to-teal-500" },
  { category: "decorator" as const, icon: Palette, color: "from-rose-500 to-pink-500" },
  { category: "transport" as const, icon: Car, color: "from-indigo-500 to-blue-500" },
  { category: "cake_maker" as const, icon: Cake, color: "from-pink-500 to-rose-500" },
  { category: "live_band" as const, icon: Music2, color: "from-violet-500 to-purple-500" },
];

const TESTIMONIALS = [
  {
    name: "Amara Johnson",
    event: "30th Birthday Party · London",
    rating: 5,
    text: "Bold Party made planning my 30th birthday effortless. It suggested exactly what I needed, the DJ and decorator were incredible, and everything ran perfectly. 10/10.",
    avatar: "AJ",
    verified: true,
  },
  {
    name: "David & Priya Okafor",
    event: "Wedding · Manchester",
    rating: 5,
    text: "We found all our vendors in one place — photographer, catering, decorator, live band. The booking system was seamless and the whole experience was simply wonderful.",
    avatar: "DO",
    verified: true,
  },
  {
    name: "TechForward Ltd",
    event: "Corporate Event · 200 guests · Birmingham",
    rating: 5,
    text: "Planned a 200-person conference in under a week. The platform handled everything — catering, AV, security, logistics. Outstanding service from start to finish.",
    avatar: "TF",
    verified: true,
  },
];

const TRUST_ITEMS = [
  { icon: Lock, label: "Stripe-secured payments" },
  { icon: Award, label: "Manually verified vendors" },
  { icon: Shield, label: "Full dispute protection" },
  { icon: Clock, label: "24/7 support team" },
  { icon: TrendingUp, label: "Money-back guarantee" },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  dj: "from-purple-700 to-violet-800",
  photographer: "from-blue-700 to-cyan-800",
  caterer: "from-amber-700 to-orange-800",
  mc: "from-emerald-700 to-teal-800",
  decorator: "from-rose-700 to-pink-800",
  transport: "from-indigo-700 to-blue-800",
  cake_maker: "from-pink-700 to-rose-800",
  live_band: "from-violet-700 to-purple-800",
  venue: "from-slate-700 to-zinc-800",
  florist: "from-green-700 to-emerald-800",
  hair_makeup: "from-fuchsia-700 to-pink-800",
  entertainment: "from-orange-700 to-red-800",
};

type FeaturedVendor = Pick<Vendor, "id" | "business_name" | "category" | "city" | "rating" | "review_count" | "starting_price" | "subscription_plan" | "verified" | "min_price"> & {
  media?: Array<{ url: string; type: string; is_cover: boolean }>;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const featuredRes = await supabase
    .from("vendors")
    .select("id, business_name, category, city, rating, review_count, starting_price, subscription_plan, verified, min_price, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .in("subscription_plan", ["featured", "pro"])
    .order("subscription_plan", { ascending: false })
    .order("rating", { ascending: false })
    .limit(6);

  const vendors = (featuredRes.data ?? []) as FeaturedVendor[];

  return (
    <div className="min-h-screen">
      <Navbar user={profile} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/12 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-900/20 rounded-full blur-[150px]" />
          {/* Floating event category cards — desktop only */}
          <div className="absolute left-6 xl:left-20 top-20 rotate-[-8deg] opacity-[0.22] hidden lg:block">
            <div className="w-32 h-40 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 border border-white/10 flex flex-col items-center justify-center gap-2 shadow-2xl">
              <span className="text-3xl">🎵</span>
              <span className="text-white text-xs font-semibold">Live DJ</span>
              <span className="text-white/50 text-xs">From £300</span>
            </div>
          </div>
          <div className="absolute right-6 xl:right-20 top-28 rotate-[8deg] opacity-[0.22] hidden lg:block">
            <div className="w-32 h-40 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-700 border border-white/10 flex flex-col items-center justify-center gap-2 shadow-2xl">
              <span className="text-3xl">📸</span>
              <span className="text-white text-xs font-semibold">Photography</span>
              <span className="text-white/50 text-xs">From £500</span>
            </div>
          </div>
          <div className="absolute left-10 xl:left-40 bottom-10 rotate-[6deg] opacity-[0.18] hidden lg:block">
            <div className="w-28 h-32 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 border border-white/10 flex flex-col items-center justify-center gap-2 shadow-2xl">
              <span className="text-2xl">🍽️</span>
              <span className="text-white text-xs font-semibold">Catering</span>
            </div>
          </div>
          <div className="absolute right-10 xl:right-40 bottom-4 rotate-[-6deg] opacity-[0.18] hidden lg:block">
            <div className="w-28 h-32 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 border border-white/10 flex flex-col items-center justify-center gap-2 shadow-2xl">
              <span className="text-2xl">🌸</span>
              <span className="text-white text-xs font-semibold">Decorator</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-brand-400 text-sm font-medium mb-8 border border-brand-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Trusted by 2,400+ happy event hosts across the UK
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="text-white">Your Perfect Event,</span>
            <br />
            <span className="gradient-brand-text">Planned in Minutes</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The UK&apos;s most trusted event marketplace. Book verified DJs, photographers, caterers, decorators and 15 more categories — with smart planning built in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/dashboard/create-event" className="btn-primary text-base py-3.5 px-8 animate-glow">
              <Sparkles size={18} />
              Plan My Event Free
              <ArrowRight size={16} />
            </Link>
            <Link href="/browse" className="btn-secondary text-base py-3.5 px-8 flex items-center gap-2">
              Browse 500+ Vendors
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center border border-white/8">
                <div className="text-2xl font-bold gradient-brand-text">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Live activity strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Sarah just booked a DJ in London
            </span>
            <span className="hidden sm:block w-px h-3 bg-white/8" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              James left a 5★ review in Manchester
            </span>
            <span className="hidden md:block w-px h-3 bg-white/8" />
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Priya planned a wedding in Surrey
            </span>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-white/2 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-400 text-sm">
              <Icon size={15} className="text-brand-400" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED VENDORS ──────────────────────────────────────────────── */}
      {vendors.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-2">Top-Rated Professionals</p>
                <h2 className="text-3xl font-extrabold text-white">Featured This Week</h2>
                <p className="text-slate-400 text-sm mt-1">Hand-picked vendors with outstanding reviews and verified portfolios.</p>
              </div>
              <Link href="/browse" className="hidden sm:flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium">
                View all vendors <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {vendors.map((v) => {
                const cat = VENDOR_CATEGORIES[v.category as keyof typeof VENDOR_CATEGORIES];
                const coverMedia = v.media?.find((m) => m.is_cover && m.type === "image") ?? v.media?.find((m) => m.type === "image");
                const gradient = CATEGORY_GRADIENTS[v.category] ?? "from-brand-700 to-violet-800";
                return (
                  <Link
                    key={v.id}
                    href={`/vendors/${v.id}`}
                    className="glass-card overflow-hidden card-hover group"
                  >
                    {/* Cover image / gradient fallback */}
                    <div className="relative h-44 overflow-hidden">
                      {coverMedia ? (
                        <Image
                          src={coverMedia.url}
                          alt={v.business_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <span className="text-5xl opacity-50">{cat?.icon ?? "🎉"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {v.subscription_plan === "featured" && (
                          <span className="badge bg-amber-500/90 text-amber-900 text-xs font-bold">⭐ Featured</span>
                        )}
                        {v.verified && (
                          <span className="badge bg-brand-500/90 text-white text-xs flex items-center gap-1">
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        )}
                      </div>
                      {(v.starting_price ?? 0) > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                          <span className="text-xs text-slate-400">From </span>
                          <span className="text-sm font-bold text-white">£{(v.starting_price ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm truncate group-hover:text-brand-400 transition-colors">
                        {v.business_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">{cat?.label ?? v.category}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={10} /> {v.city}
                        </div>
                        {v.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-white">{v.rating.toFixed(1)}</span>
                            {v.review_count > 0 && (
                              <span className="text-xs text-slate-600">({v.review_count})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center sm:hidden">
              <Link href="/browse" className="btn-secondary text-sm">
                View All Vendors <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── EVENT TYPES ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Any Occasion</p>
          <h2 className="text-3xl font-extrabold text-white">What Are You Celebrating?</h2>
          <p className="text-slate-400 mt-2 text-sm">We cover every type of UK event — big or small, intimate or grand.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(EVENT_TYPES).map(([key, { label, icon }]) => (
            <Link
              key={key}
              href={`/browse?event=${key}`}
              className="glass-card p-4 text-center hover:border-brand-500/30 transition-all card-hover cursor-pointer group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
              <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TOP CATEGORIES ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">500+ Vendors Ready</p>
            <h2 className="text-3xl font-extrabold text-white">Browse by Category</h2>
            <p className="text-slate-400 mt-2 text-sm max-w-lg mx-auto">
              From DJs to decorators, caterers to chauffeurs — every vendor you need in one trusted place.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {TOP_CATEGORIES.map(({ category, icon: Icon, color }) => {
              const cat = VENDOR_CATEGORIES[category];
              return (
                <Link
                  key={category}
                  href={`/browse?category=${category}`}
                  className="glass-card p-5 text-center hover:border-brand-500/30 transition-all card-hover group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="font-semibold text-white text-sm">{cat.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{cat.description}</div>
                </Link>
              );
            })}
          </div>
          <div className="text-center">
            <Link href="/browse" className="btn-secondary">
              View All 19 Categories
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl font-extrabold text-white">From Idea to Celebration in 4 Steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-brand-500/40 to-transparent z-0" />
                )}
                <div className="glass-card p-6 relative z-10 card-hover">
                  <div className="text-4xl font-extrabold gradient-brand-text mb-4">{step.step}</div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/how-it-works" className="btn-secondary">
              Learn More About How It Works <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-violet-950/15 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Why Bold Party</p>
            <h2 className="text-3xl font-extrabold text-white">
              Everything You Need for a{" "}
              <span className="gradient-brand-text">Flawless Event</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-7 flex gap-5 card-hover">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART CONCIERGE CTA ────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-10 text-center relative overflow-hidden border border-brand-500/20">
            <div className="absolute inset-0 gradient-brand opacity-5 pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles size={26} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Meet Your Smart Event Concierge
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-6">
              Get personalised vendor recommendations, budget estimates, event timelines, decoration ideas, and backup plans — all tailored to your specific event.
            </p>
            <Link href="/dashboard/create-event" className="btn-primary text-base py-3 px-8 inline-flex">
              <Sparkles size={16} />
              Start Planning Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Real Reviews</p>
            <h2 className="text-3xl font-extrabold text-white">Loved by Event Hosts Across the UK</h2>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
              ))}
              <span className="text-sm text-slate-400 ml-1">4.9/5 from 800+ reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card p-7 card-hover flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }, (_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {t.verified && (
                    <div className="flex items-center gap-1 text-xs text-brand-400">
                      <CheckCircle2 size={12} />
                      Verified
                    </div>
                  )}
                </div>
                <Quote size={18} className="text-brand-500/40 mb-3" />
                <p className="text-slate-300 text-sm leading-relaxed flex-1">{t.text}</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/8">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.event}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSPIRATION PREVIEW ───────────────────────────────────────────── */}
      <InspirationPreview />

      {/* ── LIVE ACTIVITY + TRENDING ───────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Live Activity */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-base font-bold text-white">Happening Now</h2>
            </div>
            <LiveActivityWidget />
          </div>

          {/* Community Spotlight */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart size={15} className="fill-brand-400 text-brand-400" />
                <h2 className="text-base font-bold text-white">Community Spotlight</h2>
              </div>
              <Link href="/inspire" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Luxury Marquee Wedding", tag: "Real Event", emoji: "💍", gradient: "from-rose-900/50 to-pink-900/50", saves: "2.4k", href: "/browse?event=wedding" },
                { title: "Neon Birthday Bash", tag: "Trending", emoji: "🎉", gradient: "from-purple-900/50 to-violet-900/50", saves: "1.8k", href: "/browse?event=birthday" },
                { title: "Floral Ceremony Arch", tag: "Most Saved", emoji: "🌸", gradient: "from-amber-900/50 to-orange-900/50", saves: "3.1k", href: "/browse?category=decorator" },
                { title: "Corporate Gala Night", tag: "Popular", emoji: "🏢", gradient: "from-blue-900/50 to-cyan-900/50", saves: "1.2k", href: "/browse?event=corporate" },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-brand-500/30 transition-all card-hover"
                >
                  <div className={`h-28 flex flex-col justify-end p-3 bg-gradient-to-br ${item.gradient}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                    <div className="absolute top-2 right-2 text-xl group-hover:scale-110 transition-transform">{item.emoji}</div>
                    <div className="absolute top-2 left-2">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/40 text-white/80">{item.tag}</span>
                    </div>
                    <div className="relative z-10">
                      <div className="text-xs font-bold text-white line-clamp-1">{item.title}</div>
                      <div className="flex items-center gap-1 text-xs text-white/50 mt-0.5">
                        <Heart size={8} className="fill-brand-400 text-brand-400" /> {item.saves} saves
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-3 text-center">
              <Link href="/inspire" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 font-medium">
                <Compass size={14} />
                Explore Inspiration Hub
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── EVENT INSPIRATION ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-brand-950/15 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Get Inspired</p>
            <h2 className="text-3xl font-extrabold text-white">Event Inspiration</h2>
            <p className="text-slate-400 mt-2 text-sm">Discover ideas and themes for your perfect celebration.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Luxury Garden Wedding",
                tags: ["Floral arch", "Live band", "Marquee"],
                icon: "💐",
                color: "from-pink-600/20 to-rose-600/20",
                border: "border-pink-500/20",
                guests: "80–200 guests",
                budget: "£8,000–£25,000",
              },
              {
                title: "Milestone Birthday Party",
                tags: ["DJ", "Decorator", "Photobooth"],
                icon: "🎂",
                color: "from-purple-600/20 to-violet-600/20",
                border: "border-purple-500/20",
                guests: "30–100 guests",
                budget: "£1,500–£6,000",
              },
              {
                title: "Corporate Conference",
                tags: ["AV & Lighting", "Catering", "MC"],
                icon: "🏢",
                color: "from-blue-600/20 to-cyan-600/20",
                border: "border-blue-500/20",
                guests: "50–500 guests",
                budget: "£3,000–£20,000",
              },
            ].map((item) => (
              <Link key={item.title} href="/dashboard/create-event" className={`glass-card p-7 bg-gradient-to-br ${item.color} border ${item.border} card-hover group`}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{t}</span>
                  ))}
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {item.guests}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> {item.budget}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-brand-400 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Plan this event
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── VENDOR EARNINGS POTENTIAL ─────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">For Event Professionals</p>
            <h2 className="text-3xl font-extrabold text-white">
              Grow Your Business with{" "}
              <span className="gradient-brand-text">Bold Party</span>
            </h2>
            <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
              Join hundreds of verified event professionals earning more bookings through the UK&apos;s fastest-growing event marketplace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: "💰",
                title: "Real Earnings",
                desc: "Top vendors earn £2,000–£8,000+ per month through Bold Party. Keep 90% of every booking — we only take a small platform fee.",
                highlight: "£2K–£8K/month",
                color: "from-amber-500/10 to-orange-500/10",
                border: "border-amber-500/20",
              },
              {
                icon: "📈",
                title: "Grow Your Reach",
                desc: "Your profile reaches thousands of event hosts searching for exactly your services. Pro and Featured plans boost your visibility even further.",
                highlight: "10,000+ monthly searches",
                color: "from-blue-500/10 to-cyan-500/10",
                border: "border-blue-500/20",
              },
              {
                icon: "🛡️",
                title: "Handled for You",
                desc: "We handle invoicing, contracts, deposits, reminders, and dispute resolution. You focus on delivering great events — we handle the rest.",
                highlight: "Zero admin hassle",
                color: "from-emerald-500/10 to-teal-500/10",
                border: "border-emerald-500/20",
              },
            ].map((item) => (
              <div key={item.title} className={`glass-card p-6 bg-gradient-to-br ${item.color} border ${item.border} card-hover`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">{item.highlight}</div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 gradient-brand opacity-5 pointer-events-none" />
            <div className="md:flex items-center justify-between gap-8">
              <div className="mb-6 md:mb-0">
                <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
                  Ready to Start Earning?
                </h3>
                <p className="text-slate-400 text-sm max-w-lg">
                  Create your vendor profile in minutes. Our team approves applications within 48 hours. Free to join — no upfront cost.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                  {["Free to join", "48h approval", "Keep 90%", "Full support"].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-sm text-slate-400">
                      <CheckCircle2 size={13} className="text-brand-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link href="/vendor/apply" className="btn-primary text-base py-3 px-7 whitespace-nowrap">
                  <Sparkles size={16} />
                  Apply as a Vendor
                </Link>
                <Link href="/how-it-works" className="btn-secondary text-base py-3 px-7 whitespace-nowrap">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
