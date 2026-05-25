import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InspirationFeed } from "@/components/ui/InspirationFeed";
import { Sparkles, ArrowRight, TrendingUp, Palette, Heart, Star, BadgeCheck, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Event Inspiration | Bold Party",
  description: "Discover stunning event ideas, trending themes, and beautiful decorations. Get inspired for your next celebration.",
};

export const dynamic = "force-dynamic";

const TRENDING_THEMES = [
  { emoji: "🌸", label: "Garden Party", count: "2.4k saves", href: "/browse?event=wedding" },
  { emoji: "🎭", label: "Masquerade Ball", count: "1.8k saves", href: "/browse?event=birthday" },
  { emoji: "🌴", label: "Tropical Paradise", count: "1.6k saves", href: "/browse?event=birthday" },
  { emoji: "✨", label: "Enchanted Forest", count: "1.4k saves", href: "/browse?event=wedding" },
  { emoji: "🖤", label: "Black & Gold Luxe", count: "1.2k saves", href: "/browse?event=corporate" },
  { emoji: "🎠", label: "Vintage Carousel", count: "980 saves", href: "/browse?event=birthday" },
  { emoji: "🌿", label: "Boho Greenhouse", count: "870 saves", href: "/browse?event=wedding" },
  { emoji: "🎪", label: "Circus Spectacular", count: "760 saves", href: "/browse?event=birthday" },
];

const COLOUR_PALETTES = [
  {
    name: "Rose Gold & Ivory",
    colors: ["#B76E79", "#F5E6D3", "#D4AF8C", "#F8F4F0"],
    saves: "3.2k",
    style: "Wedding · Anniversary",
    mood: "Romantic & Timeless",
    href: "/browse?category=decorator&event=wedding",
    vendors: "Decorators & Florists",
  },
  {
    name: "Midnight Navy & Gold",
    colors: ["#1B2A4A", "#C9A84C", "#0D1B2A", "#E8D5A0"],
    saves: "2.8k",
    style: "Corporate · Gala",
    mood: "Bold & Sophisticated",
    href: "/browse?category=lighting_stage&event=corporate",
    vendors: "Lighting & Staging",
  },
  {
    name: "Sage & Terracotta",
    colors: ["#87A878", "#C4714F", "#F2E8DF", "#5C4033"],
    saves: "2.1k",
    style: "Boho · Garden Party",
    mood: "Natural & Earthy",
    href: "/browse?category=decorator&event=wedding",
    vendors: "Decorators & Florists",
  },
  {
    name: "Dusty Lavender",
    colors: ["#C8B8D8", "#9B8AA3", "#F0EBF5", "#6E5F80"],
    saves: "1.9k",
    style: "Baby Shower · Wedding",
    mood: "Soft & Dreamy",
    href: "/browse?category=balloon_decorator&event=baby_shower",
    vendors: "Balloon Decorators",
  },
  {
    name: "Emerald & Champagne",
    colors: ["#2D6A4F", "#F0E5B0", "#1B4332", "#C8B460"],
    saves: "1.7k",
    style: "Anniversary · Wedding",
    mood: "Luxurious & Rich",
    href: "/browse?category=decorator&event=anniversary",
    vendors: "Decorators & Styling",
  },
  {
    name: "Blush & Burgundy",
    colors: ["#FFB6C1", "#800020", "#FFF0F3", "#4A0010"],
    saves: "1.5k",
    style: "Wedding · Engagement",
    mood: "Passionate & Elegant",
    href: "/browse?category=decorator&event=engagement",
    vendors: "Decorators & Florists",
  },
];

const INSPIRATION_COLLECTIONS = [
  {
    title: "Wedding Wonderland",
    description: "Luxurious wedding ceremonies and receptions",
    count: 48,
    emoji: "💍",
    gradient: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/20",
    href: "/browse?category=decorator&event=wedding",
  },
  {
    title: "Birthday Extravaganza",
    description: "Milestone birthdays done in spectacular style",
    count: 62,
    emoji: "🎂",
    gradient: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/20",
    href: "/browse?event=birthday",
  },
  {
    title: "Corporate Excellence",
    description: "Professional events that make an impression",
    count: 34,
    emoji: "🏢",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
    href: "/browse?event=corporate",
  },
  {
    title: "Baby Shower Dreams",
    description: "Soft, beautiful celebrations for new arrivals",
    count: 29,
    emoji: "👶",
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/20",
    href: "/browse?event=baby_shower",
  },
  {
    title: "Table Styling",
    description: "Centrepieces, linens, and tablescape magic",
    count: 55,
    emoji: "🌸",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    href: "/browse?category=decorator",
  },
  {
    title: "Lighting & Atmosphere",
    description: "Fairy lights, uplighting, and ambient magic",
    count: 41,
    emoji: "💡",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    href: "/browse?category=lighting_stage",
  },
];

export default async function InspirePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const [{ data: featuredVendors }, { data: spotlightVendors }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, business_name, category, city, rating, review_count, media:vendor_media(url, type, is_cover, caption)")
      .eq("status", "approved")
      .eq("verified", true)
      .order("rating", { ascending: false })
      .limit(20),
    supabase
      .from("vendors")
      .select("id, business_name, category, city, rating, review_count, verified, tagline, media:vendor_media(url, type, is_cover)")
      .eq("status", "approved")
      .gte("rating", 4.5)
      .order("review_count", { ascending: false })
      .limit(4),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar user={profile} />

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-brand-600/12 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-brand-400 text-sm font-medium mb-6">
            <Sparkles size={13} />
            Event Inspiration Hub
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Find Your <span className="gradient-brand-text">Perfect Vision</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            Thousands of stunning event ideas, trending themes, and beautiful setups — curated for every occasion and style.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/create-event" className="btn-primary py-3 px-8">
              <Sparkles size={16} />
              Plan This Style
            </Link>
            <Link href="/browse" className="btn-secondary py-3 px-8">
              Find Vendors
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Themes — responsive wrap, no clipping */}
      <section className="py-12 px-4 border-y border-white/6 bg-white/2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <TrendingUp size={13} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Trending Themes</h2>
            <span className="text-xs text-slate-500 ml-1">This week&apos;s most-saved ideas</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {TRENDING_THEMES.map((theme) => (
              <Link
                key={theme.label}
                href={theme.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-white/10 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform flex-shrink-0">{theme.emoji}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{theme.label}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Heart size={9} className="fill-brand-400 text-brand-400 flex-shrink-0" /> {theme.count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette size={16} className="text-brand-400" />
                <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Collections</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">Browse by Theme</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INSPIRATION_COLLECTIONS.map((col) => (
              <Link
                key={col.title}
                href={col.href}
                className={`glass-card p-5 bg-gradient-to-br ${col.gradient} border ${col.border} card-hover group text-center`}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{col.emoji}</div>
                <div className="font-semibold text-white text-sm mb-1 leading-tight">{col.title}</div>
                <div className="text-xs text-slate-500">{col.count} ideas</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Colour Palettes — with purpose: click to filter vendors by style */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-brand-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={16} className="text-brand-400" />
            <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Trending Palettes</span>
          </div>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-white">Colour Inspiration</h2>
            <p className="text-slate-500 text-xs hidden sm:block">Click a palette to discover matching vendors</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COLOUR_PALETTES.map((palette) => (
              <Link
                key={palette.name}
                href={palette.href}
                className="glass-card p-5 card-hover group border border-white/8 hover:border-brand-500/25 transition-all"
              >
                {/* Colour swatches */}
                <div className="flex gap-1.5 mb-4">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-14 rounded-lg transition-transform group-hover:scale-y-110 origin-bottom"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {/* Name + mood */}
                <div className="mb-3">
                  <div className="text-sm font-bold text-white">{palette.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{palette.mood}</div>
                </div>
                {/* Action row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{palette.style}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Heart size={9} className="fill-brand-400 text-brand-400" />
                      {palette.saves}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-brand-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {palette.vendors} <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">
            Each palette links to matching vendors who specialise in that style — browse and book directly.
          </p>
        </div>
      </section>

      {/* Vendor Spotlight */}
      {(spotlightVendors?.length ?? 0) > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck size={16} className="text-brand-400" />
                  <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Community</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">Vendor Spotlight</h2>
                <p className="text-slate-400 text-sm mt-1">Exceptional professionals trusted by hundreds of hosts</p>
              </div>
              <Link href="/browse" className="btn-secondary text-sm py-2 px-4 hidden sm:inline-flex">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(spotlightVendors ?? []).map((vendor) => {
                const cover = (vendor.media as Array<{ url: string; is_cover: boolean; type: string }> | null)?.find((m) => m.is_cover && m.type === "image") ??
                  (vendor.media as Array<{ url: string; type: string }> | null)?.[0];
                return (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.id}`}
                    className="glass-card overflow-hidden card-hover group"
                  >
                    <div className="h-40 relative overflow-hidden bg-gradient-to-br from-brand-900/40 to-violet-900/40">
                      {cover?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.url} alt={vendor.business_name} className="w-full h-full object-cover ken-burns" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎉</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {vendor.verified && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand-500/80 backdrop-blur-sm">
                          <BadgeCheck size={10} className="text-white" />
                          <span className="text-xs text-white font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors truncate">{vendor.business_name}</h3>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">{vendor.category?.replace("_", " ")} · {vendor.city}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-white">{(vendor.rating ?? 0).toFixed(1)}</span>
                        <span className="text-xs text-slate-600">({vendor.review_count ?? 0})</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Event of the Week */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-900/30 via-violet-900/20 to-blue-900/20 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="text-7xl flex-shrink-0">💍</div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
                  <Star size={10} className="fill-amber-400" /> Event of the Week
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Emily &amp; Tom&apos;s Garden Wedding</h2>
                <p className="text-slate-400 text-sm mb-4 max-w-lg">
                  A breathtaking outdoor celebration at Kensington Gardens — featuring a 12-piece orchestra, bespoke floral arches, and a 5-star catered feast for 120 guests.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Live Orchestra", "Floral Arch", "Marquee", "Photographer", "Catering"].map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-slate-300">{tag}</span>
                  ))}
                </div>
                <Link href="/dashboard/create-event" className="btn-primary text-sm py-2.5 px-6">
                  <Sparkles size={14} />
                  Plan Something Like This
                </Link>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-2 flex-shrink-0 w-48">
                {["from-rose-600/30 to-pink-600/30", "from-amber-600/30 to-orange-600/30", "from-violet-600/30 to-purple-600/30", "from-emerald-600/30 to-teal-600/30"].map((g, i) => (
                  <div key={i} className={`h-20 rounded-xl bg-gradient-to-br ${g} border border-white/10 flex items-center justify-center text-2xl`}>
                    {["🌸", "🕯️", "🎵", "🍽️"][i]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Inspiration Feed — real portfolio photos */}
      <InspirationFeed vendors={featuredVendors ?? []} />

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto glass-card p-10 text-center relative overflow-hidden border border-brand-500/20">
          <div className="absolute inset-0 gradient-brand opacity-5 pointer-events-none" />
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
            Love What You See?
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Let our Smart Planner build you a complete event plan inspired by your favourite styles — vendors, budget, and timeline included.
          </p>
          <Link href="/dashboard/create-event" className="btn-primary text-base py-3 px-8 inline-flex">
            <Sparkles size={16} />
            Start Planning for Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
