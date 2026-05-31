import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InspirationFeed } from "@/components/ui/InspirationFeed";
import { ArrowRight, Star, BadgeCheck, Heart, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Event Inspiration",
  description: "Discover stunning event ideas, colour palettes and themes for weddings, birthdays and extraordinary celebrations.",
};

export const dynamic = "force-dynamic";

const TRENDING_THEMES = [
  { label: "Garden Party",     href: "/browse?event=wedding&theme=garden-party"      },
  { label: "Masquerade Ball",  href: "/browse?event=birthday&theme=masquerade"       },
  { label: "Tropical Paradise",href: "/browse?event=birthday&theme=tropical-paradise"},
  { label: "Enchanted Forest", href: "/browse?event=wedding&theme=enchanted-forest"  },
  { label: "Black & Gold Luxe",href: "/browse?event=corporate&theme=black-gold-luxe" },
  { label: "Vintage Carousel", href: "/browse?event=birthday&theme=vintage-carousel" },
  { label: "Boho Greenhouse",  href: "/browse?event=wedding&theme=boho-greenhouse"   },
  { label: "Circus Spectacular",href: "/browse?event=birthday&theme=circus-spectacular"},
];

const COLOUR_PALETTES = [
  {
    name: "Rose Gold & Ivory",
    colors: ["#B76E79", "#F5E6D3", "#D4AF8C", "#F8F4F0"],
    style: "Wedding · Anniversary",
    mood: "Romantic & Timeless",
    href: "/browse?category=decorator&event=wedding",
    vendors: "Decorators & Florists",
  },
  {
    name: "Midnight Navy & Gold",
    colors: ["#1B2A4A", "#C9A84C", "#0D1B2A", "#E8D5A0"],
    style: "Corporate · Gala",
    mood: "Bold & Sophisticated",
    href: "/browse?category=lighting_stage&event=corporate",
    vendors: "Lighting & Staging",
  },
  {
    name: "Sage & Terracotta",
    colors: ["#87A878", "#C4714F", "#F2E8DF", "#5C4033"],
    style: "Boho · Garden Party",
    mood: "Natural & Earthy",
    href: "/browse?category=decorator&event=wedding",
    vendors: "Decorators & Florists",
  },
  {
    name: "Dusty Lavender",
    colors: ["#C8B8D8", "#9B8AA3", "#F0EBF5", "#6E5F80"],
    style: "Baby Shower · Wedding",
    mood: "Soft & Dreamy",
    href: "/browse?category=balloon_decorator&event=baby_shower",
    vendors: "Balloon Decorators",
  },
  {
    name: "Emerald & Champagne",
    colors: ["#2D6A4F", "#F0E5B0", "#1B4332", "#C8B460"],
    style: "Anniversary · Wedding",
    mood: "Luxurious & Rich",
    href: "/browse?category=decorator&event=anniversary",
    vendors: "Decorators & Styling",
  },
  {
    name: "Blush & Burgundy",
    colors: ["#FFB6C1", "#800020", "#FFF0F3", "#4A0010"],
    style: "Wedding · Engagement",
    mood: "Passionate & Elegant",
    href: "/browse?category=decorator&event=engagement",
    vendors: "Decorators & Florists",
  },
];

const INSPIRATION_COLLECTIONS = [
  { title: "Wedding",     href: "/browse?category=decorator&event=wedding" },
  { title: "Birthday",    href: "/browse?event=birthday"                   },
  { title: "Corporate",   href: "/browse?event=corporate"                  },
  { title: "Baby Shower", href: "/browse?event=baby_shower"                },
  { title: "Table Styling",href: "/browse?category=decorator"              },
  { title: "Lighting",    href: "/browse?category=lighting_stage"          },
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
      <Navbar user={profile} />

      {/* Aspirational hero — dark luxury */}
      <section className="pt-16 relative overflow-hidden" style={{ background: "#0D1B3E" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 55% at 50% 20%, rgba(201,168,76,0.055) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <p
            className="text-xs tracking-[0.35em] font-semibold mb-10 uppercase"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            Inspiration
          </p>

          <h1
            className="font-light tracking-tight leading-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", color: "rgba(255,255,255,0.92)" }}
          >
            Extraordinary.
            <br />
            <span style={{ color: "#C9A84C" }}>Imagined.</span> Celebrated.
          </h1>

          <p
            className="text-base font-light leading-relaxed max-w-xl mx-auto mb-12"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Discover stunning ideas, colour palettes and themes for weddings,
            birthdays and every extraordinary occasion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/create-event" className="btn-luxury">
              Plan This Style
            </Link>
            <Link href="/browse" className="btn-luxury-outline">
              Find Vendors <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Colour palette preview strip — teaser of what's below */}
        <div className="flex gap-0 overflow-hidden" aria-hidden="true">
          {["#B76E79", "#F5E6D3", "#1B2A4A", "#C9A84C", "#87A878", "#C4714F", "#C8B8D8", "#9B8AA3", "#2D6A4F", "#F0E5B0"].map((color, i) => (
            <div
              key={i}
              className="flex-1 h-2"
              style={{ background: color, opacity: 0.65 }}
            />
          ))}
        </div>
      </section>

      {/* Trending Themes */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
                style={{ color: "rgba(201,168,76,0.7)" }}
              >
                Most Saved
              </p>
              <h2 className="text-2xl font-light text-gray-900 tracking-tight">Trending Themes</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRENDING_THEMES.map((theme) => (
              <Link
                key={theme.label}
                href={theme.href}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <span className="text-sm font-medium text-gray-900">{theme.label}</span>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Occasion */}
      <section className="py-16 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-6xl mx-auto">
          <p
            className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
            style={{ color: "rgba(201,168,76,0.7)" }}
          >
            Collections
          </p>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-10">Browse by Occasion</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INSPIRATION_COLLECTIONS.map((col) => (
              <Link
                key={col.title}
                href={col.href}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-md transition-all group text-center"
              >
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "#0D1B3E" }}
                >
                  <svg width="14" height="14" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                    <polygon points="13,1 25,13 13,25 1,13" stroke="#C9A84C" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <div className="font-medium text-gray-900 text-sm">{col.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Colour Palettes */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
                style={{ color: "rgba(201,168,76,0.7)" }}
              >
                Colour Inspiration
              </p>
              <h2 className="text-2xl font-light text-gray-900 tracking-tight">Palette & Mood</h2>
            </div>
            <p className="text-gray-400 text-xs hidden sm:block font-light">Click a palette to browse matching vendors</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COLOUR_PALETTES.map((palette) => (
              <Link
                key={palette.name}
                href={palette.href}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-md transition-all group"
              >
                <div className="flex gap-1.5 mb-5">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-12 rounded-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">{palette.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-light">{palette.mood}</div>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
                  <span className="text-xs text-gray-400 font-light">{palette.style}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#0D1B3E" }}>
                      {palette.vendors} <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor Spotlight */}
      {(spotlightVendors?.length ?? 0) > 0 && (
        <section className="py-20 px-4" style={{ background: "#f8f7f5" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p
                  className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
                  style={{ color: "rgba(201,168,76,0.7)" }}
                >
                  Vendor Spotlight
                </p>
                <h2 className="text-2xl font-light text-gray-900 tracking-tight">Exceptional Professionals</h2>
              </div>
              <Link href="/browse" className="text-sm font-light text-gray-400 hover:text-gray-900 flex items-center gap-1.5 transition-colors hidden sm:flex">
                View All <ArrowRight size={13} />
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
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group"
                  >
                    <div className="h-44 relative overflow-hidden" style={{ background: "#0D1B3E" }}>
                      {cover?.url ? (
                        <Image
                          src={cover.url}
                          alt={vendor.business_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/brand/elbold-mark.svg" width="40" height="40" alt="" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {vendor.verified && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm">
                          <BadgeCheck size={10} style={{ color: "#0D1B3E" }} />
                          <span className="text-xs font-semibold" style={{ color: "#0D1B3E" }}>Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{vendor.business_name}</h3>
                      <p className="text-xs text-gray-400 capitalize mt-0.5 font-light">
                        {vendor.category?.replace("_", " ")} · {vendor.city}
                      </p>
                      <div className="flex items-center gap-1 mt-2.5">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-gray-900">{(vendor.rating ?? 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400 font-light">({vendor.review_count ?? 0})</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured event */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-10 md:p-12"
            style={{ background: "#0D1B3E" }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
              >
                <span style={{ color: "#C9A84C", fontSize: "28px" }}>&#x2665;</span>
              </div>
              <div className="flex-1">
                <p
                  className="text-xs tracking-[0.2em] font-semibold mb-3 uppercase"
                  style={{ color: "rgba(201,168,76,0.6)" }}
                >
                  Event of the Week
                </p>
                <h2
                  className="text-2xl font-light mb-3 tracking-tight"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  Emily & Tom&apos;s Garden Wedding
                </h2>
                <p className="text-sm font-light leading-relaxed mb-5 max-w-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
                  A breathtaking outdoor celebration featuring a 12-piece orchestra, bespoke floral arches
                  and a 5-star catered feast for 120 guests.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Live Orchestra", "Floral Arch", "Marquee", "Photographer", "Catering"].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded font-light"
                      style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.7)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/dashboard/create-event" className="btn-luxury text-sm py-3 px-6">
                  Plan Something Like This
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor feed */}
      <InspirationFeed vendors={featuredVendors ?? []} />

      {/* Final CTA */}
      <section className="py-24 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/elbold-mark.svg" width="56" height="56" alt="ELBOLD" />
          </div>
          <h2 className="text-3xl font-light tracking-tight mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>
            Love What You See?
          </h2>
          <p className="font-light leading-relaxed mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Let our Smart Planner build a complete event plan based on your favourite styles.
            Vendors, budget and timeline included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/create-event" className="btn-luxury">
              Start Planning for Free
            </Link>
            <Link href="/browse" className="btn-luxury-outline">
              Browse Vendors
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
