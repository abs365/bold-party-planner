import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InspirationFeed } from "@/components/ui/InspirationFeed";
import { Sparkles, ArrowRight, TrendingUp, Palette, Heart, Star, BadgeCheck, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Event Inspiration | ELBOLD Events",
  description: "Discover stunning event ideas, trending themes, and beautiful decorations. Get inspired for your next celebration.",
};

export const dynamic = "force-dynamic";

const TRENDING_THEMES = [
  { emoji: "ðŸŒ¸", label: "Garden Party", count: "2.4k saves", href: "/browse?event=wedding" },
  { emoji: "ðŸŽ­", label: "Masquerade Ball", count: "1.8k saves", href: "/browse?event=birthday" },
  { emoji: "ðŸŒ´", label: "Tropical Paradise", count: "1.6k saves", href: "/browse?event=birthday" },
  { emoji: "âœ¨", label: "Enchanted Forest", count: "1.4k saves", href: "/browse?event=wedding" },
  { emoji: "ðŸ–¤", label: "Black & Gold Luxe", count: "1.2k saves", href: "/browse?event=corporate" },
  { emoji: "ðŸŽ ", label: "Vintage Carousel", count: "980 saves", href: "/browse?event=birthday" },
  { emoji: "ðŸŒ¿", label: "Boho Greenhouse", count: "870 saves", href: "/browse?event=wedding" },
  { emoji: "ðŸŽª", label: "Circus Spectacular", count: "760 saves", href: "/browse?event=birthday" },
];

const COLOUR_PALETTES = [
  {
    name: "Rose Gold & Ivory",
    colors: ["#B76E79", "#F5E6D3", "#D4AF8C", "#F8F4F0"],
    saves: "3.2k",
    style: "Wedding Â· Anniversary",
    mood: "Romantic & Timeless",
    href: "/browse?category=decorator&event=wedding",
    vendors: "Decorators & Florists",
  },
  {
    name: "Midnight Navy & Gold",
    colors: ["#1B2A4A", "#C9A84C", "#0D1B2A", "#E8D5A0"],
    saves: "2.8k",
    style: "Corporate Â· Gala",
    mood: "Bold & Sophisticated",
    href: "/browse?category=lighting_stage&event=corporate",
    vendors: "Lighting & Staging",
  },
  {
    name: "Sage & Terracotta",
    colors: ["#87A878", "#C4714F", "#F2E8DF", "#5C4033"],
    saves: "2.1k",
    style: "Boho Â· Garden Party",
    mood: "Natural & Earthy",
    href: "/browse?category=decorator&event=wedding",
    vendors: "Decorators & Florists",
  },
  {
    name: "Dusty Lavender",
    colors: ["#C8B8D8", "#9B8AA3", "#F0EBF5", "#6E5F80"],
    saves: "1.9k",
    style: "Baby Shower Â· Wedding",
    mood: "Soft & Dreamy",
    href: "/browse?category=balloon_decorator&event=baby_shower",
    vendors: "Balloon Decorators",
  },
  {
    name: "Emerald & Champagne",
    colors: ["#2D6A4F", "#F0E5B0", "#1B4332", "#C8B460"],
    saves: "1.7k",
    style: "Anniversary Â· Wedding",
    mood: "Luxurious & Rich",
    href: "/browse?category=decorator&event=anniversary",
    vendors: "Decorators & Styling",
  },
  {
    name: "Blush & Burgundy",
    colors: ["#FFB6C1", "#800020", "#FFF0F3", "#4A0010"],
    saves: "1.5k",
    style: "Wedding Â· Engagement",
    mood: "Passionate & Elegant",
    href: "/browse?category=decorator&event=engagement",
    vendors: "Decorators & Florists",
  },
];

const INSPIRATION_COLLECTIONS = [
  { title: "Wedding Wonderland", count: 48, emoji: "ðŸ’", bg: "bg-rose-50", border: "border-rose-100", href: "/browse?category=decorator&event=wedding" },
  { title: "Birthday Extravaganza", count: 62, emoji: "ðŸŽ‚", bg: "bg-purple-50", border: "border-purple-100", href: "/browse?event=birthday" },
  { title: "Corporate Excellence", count: 34, emoji: "ðŸ¢", bg: "bg-blue-50", border: "border-blue-100", href: "/browse?event=corporate" },
  { title: "Baby Shower Dreams", count: 29, emoji: "ðŸ‘¶", bg: "bg-amber-50", border: "border-amber-100", href: "/browse?event=baby_shower" },
  { title: "Table Styling", count: 55, emoji: "ðŸŒ¸", bg: "bg-emerald-50", border: "border-emerald-100", href: "/browse?category=decorator" },
  { title: "Lighting & Atmosphere", count: 41, emoji: "ðŸ’¡", bg: "bg-orange-50", border: "border-orange-100", href: "/browse?category=lighting_stage" },
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
    <div className="min-h-screen bg-white">
      <Navbar user={profile} lightBg />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6">
            <Sparkles size={13} />
            Event Inspiration Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your <span className="gradient-brand-text">Perfect Vision</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            Stunning event ideas, trending themes and beautiful setups, curated for every occasion and style.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/create-event" className="btn-primary py-3 px-8">
              <Sparkles size={15} />
              Plan This Style
            </Link>
            <Link href="/browse" className="btn-secondary-light py-3 px-8">
              Find Vendors
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Themes */}
      <section className="py-12 px-4 border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Trending Themes</h2>
            <span className="text-sm text-gray-400">This week&apos;s most-saved ideas</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRENDING_THEMES.map((theme) => (
              <Link
                key={theme.label}
                href={theme.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <span className="text-xl flex-shrink-0">{theme.emoji}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{theme.label}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Heart size={9} className="text-brand-500 fill-brand-500 flex-shrink-0" /> {theme.count}
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
          <div className="flex items-center gap-2 mb-2">
            <Palette size={15} className="text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Collections</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Theme</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INSPIRATION_COLLECTIONS.map((col) => (
              <Link
                key={col.title}
                href={col.href}
                className={`${col.bg} border ${col.border} rounded-xl p-5 hover:shadow-md transition-shadow group text-center`}
              >
                <div className="text-3xl mb-3">{col.emoji}</div>
                <div className="font-medium text-gray-900 text-sm mb-1 leading-tight">{col.title}</div>
                <div className="text-xs text-gray-400">{col.count} ideas</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Colour Palettes */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={15} className="text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Trending Palettes</span>
          </div>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Colour Inspiration</h2>
            <p className="text-gray-400 text-xs hidden sm:block">Click a palette to discover matching vendors</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COLOUR_PALETTES.map((palette) => (
              <Link
                key={palette.name}
                href={palette.href}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className="flex gap-1.5 mb-4">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-14 rounded-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mb-3">
                  <div className="text-sm font-semibold text-gray-900">{palette.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{palette.mood}</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{palette.style}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Heart size={9} className="fill-brand-500 text-brand-500" />
                      {palette.saves}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-brand-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {palette.vendors} <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Each palette links to matching vendors who specialise in that style. Browse and book directly.
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
                  <BadgeCheck size={15} className="text-gray-400" />
                  <span className="text-gray-400 text-sm font-medium">Community</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Vendor Spotlight</h2>
                <p className="text-gray-500 text-sm mt-1">Exceptional professionals trusted by hundreds of hosts</p>
              </div>
              <Link href="/browse" className="btn-secondary-light text-sm py-2 px-4 hidden sm:inline-flex">
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
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="h-40 relative overflow-hidden bg-gray-100">
                      {cover?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.url} alt={vendor.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">ðŸŽ‰</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {vendor.verified && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/90">
                          <BadgeCheck size={10} className="text-brand-600" />
                          <span className="text-xs text-brand-700 font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 transition-colors truncate">{vendor.business_name}</h3>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{vendor.category?.replace("_", " ")} Â· {vendor.city}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-gray-900">{(vendor.rating ?? 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({vendor.review_count ?? 0})</span>
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
      <section className="py-10 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="text-6xl flex-shrink-0">ðŸ’</div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium mb-3">
                  <Star size={10} className="fill-amber-500" /> Event of the Week
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Emily &amp; Tom&apos;s Garden Wedding</h2>
                <p className="text-gray-500 text-sm mb-4 max-w-lg">
                  A breathtaking outdoor celebration at Kensington Gardens, featuring a 12-piece orchestra, bespoke floral arches and a 5-star catered feast for 120 guests.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Live Orchestra", "Floral Arch", "Marquee", "Photographer", "Catering"].map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600">{tag}</span>
                  ))}
                </div>
                <Link href="/dashboard/create-event" className="btn-primary text-sm py-2.5 px-6">
                  <Sparkles size={14} />
                  Plan Something Like This
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Inspiration Feed */}
      <InspirationFeed vendors={featuredVendors ?? []} />

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">âœ¨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Love What You See?
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Let our Smart Planner build a complete event plan based on your favourite styles: vendors, budget and timeline included.
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
