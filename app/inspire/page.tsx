import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShowcaseGrid } from "@/components/ui/ShowcaseGrid";
import type { ShowcaseItem } from "@/components/ui/ShowcaseGrid";
import { ArrowRight, BookOpen, Camera, Shield } from "lucide-react";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Inspiration & Guides | ELBOLD Events",
  description:
    "Discover event ideas, browse real work from verified UK professionals, and read expert planning guides. Every photographer, decorator, DJ and caterer on ELBOLD is individually reviewed.",
};

export const dynamic = "force-dynamic";

// ── Occasion showcase: links to filtered browse ───────────────────────────
const OCCASIONS = [
  {
    label: "Weddings",
    href: "/browse?event=wedding",
    photo: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=75",
  },
  {
    label: "Birthdays",
    href: "/browse?event=birthday",
    photo: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=700&q=75",
  },
  {
    label: "Corporate Events",
    href: "/browse?event=corporate",
    photo: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=700&q=75",
  },
  {
    label: "Anniversaries",
    href: "/browse?event=anniversary",
    photo: "https://images.unsplash.com/photo-1516589091380-5d8259b23548?auto=format&fit=crop&w=700&q=75",
  },
  {
    label: "Cultural Celebrations",
    href: "/browse?event=cultural",
    photo: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=75",
  },
  {
    label: "Baby Showers",
    href: "/browse?event=baby_shower",
    photo: null,
  },
];

// ── Planning guides: real slugs from lib/guides.ts ────────────────────────
const GUIDES = [
  {
    slug: "wedding-planning-checklist-uk",
    title: "Wedding Planning Checklist UK",
    category: "Weddings",
    desc: "A complete, month-by-month timeline for planning a UK wedding, from venue booking to final confirmations.",
    accent: "#0B1F4D",
  },
  {
    slug: "how-to-choose-a-photographer",
    title: "How to Choose the Right Photographer",
    category: "Photography",
    desc: "What to look for in portfolios, contracts, and prices before booking a wedding or event photographer.",
    accent: "#1a1060",
  },
  {
    slug: "how-much-does-a-dj-cost-in-essex",
    title: "How Much Does a DJ Cost in Essex?",
    category: "Music & DJs",
    desc: "A transparent breakdown of DJ pricing for weddings, parties, and corporate events across Essex.",
    accent: "#162e1a",
  },
  {
    slug: "birthday-party-planning-guide",
    title: "Birthday Party Planning Guide",
    category: "Birthdays",
    desc: "From intimate gatherings to large celebrations: how to plan a birthday party that people remember.",
    accent: "#2a1010",
  },
  {
    slug: "corporate-event-planning-checklist",
    title: "Corporate Event Planning Checklist",
    category: "Corporate",
    desc: "A professional checklist for planning conferences, team events, and corporate celebrations.",
    accent: "#0d1e30",
  },
];

export default async function ShowcasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data;
  }

  // Fetch real vendor media: inner join ensures only approved vendors
  const { data: rawMedia } = await supabase
    .from("vendor_media")
    .select(`
      id, url, type, caption,
      vendor:vendors!inner(id, business_name, category, city, rating, review_count, verification_level)
    `)
    .eq("vendors.status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  type VendorRow = {
    id: string;
    business_name: string;
    category: string;
    city: string;
    rating: number;
    review_count: number;
    verification_level: number;
  };

  const items: ShowcaseItem[] = (rawMedia ?? [])
    .map((m) => {
      const vendorRaw = m.vendor as VendorRow | VendorRow[] | null;
      const vendor = Array.isArray(vendorRaw) ? vendorRaw[0] : vendorRaw;
      if (!vendor) return null;
      return {
        id: m.id,
        url: m.url,
        type: (m.type === "video" ? "video" : "image") as "image" | "video",
        caption: m.caption ?? null,
        vendor: {
          id: vendor.id,
          business_name: vendor.business_name,
          category: vendor.category,
          city: vendor.city,
          rating: vendor.rating ?? 0,
          review_count: vendor.review_count ?? 0,
          verification_level: vendor.verification_level ?? 0,
        },
      };
    })
    .filter((item): item is ShowcaseItem => item !== null);

  const imageCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.filter((i) => i.type === "video").length;
  const vendorCount = new Set(items.map((i) => i.vendor.id)).size;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* ── SECTION 1: EDITORIAL HERO ─────────────────────────────────── */}
      <section
        className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden pt-16"
        style={{ background: "linear-gradient(160deg, #0B1F4D 0%, #09162e 50%, #060e1e 100%)" }}
      >
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80"
            alt="Event celebration inspiration"
            fill
            priority
            quality={80}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(4,10,28,0.64) 0%, rgba(6,14,36,0.54) 40%, rgba(4,8,22,0.70) 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 60%)" }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-24">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-10" style={{ background: "rgba(212,175,55,0.2)" }} />
            <span className="text-xs tracking-[0.45em] font-light" style={{ color: "rgba(212,175,55,0.45)" }}>
              INSPIRATION &amp; IDEAS
            </span>
            <div className="h-px w-10" style={{ background: "rgba(212,175,55,0.2)" }} />
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.08] text-white mb-6"
          >
            This Is What
            <br />
            An Extraordinary
            <br />
            <span style={{ color: "#D4AF37" }}>Event Looks Like.</span>
          </h1>

          <p className="text-base font-light leading-relaxed max-w-lg mx-auto mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
            Browse real work from verified UK event professionals.
            Read expert planning guides. Discover ideas by occasion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="btn-luxury text-base px-10 py-4">
              Find Professionals <ArrowRight size={15} />
            </Link>
            <Link href="/guides" className="btn-luxury-outline text-base px-10 py-4">
              Planning Guides <BookOpen size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: OCCASION SHOWCASE ─────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Inspiration by Occasion
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight">
              What Are You Celebrating?
            </h2>
            <p className="text-sm text-gray-400 font-light mt-3 max-w-md mx-auto">
              Browse verified professionals curated by event type, from intimate gatherings to grand celebrations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OCCASIONS.map((occ) => (
              <Link
                key={occ.label}
                href={occ.href}
                className="group relative rounded-2xl overflow-hidden"
                style={{
                  background: "#0B1F4D",
                  minHeight: "220px",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {occ.photo && (
                  <div className="absolute inset-0">
                    <Image
                      src={occ.photo}
                      alt={occ.label}
                      fill
                      quality={70}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(4,8,20,0.72) 0%, rgba(4,8,20,0.35) 40%, rgba(4,8,20,0.10) 100%)" }}
                />
                <div className="relative z-10 p-7 h-full flex flex-col justify-end" style={{ minHeight: "220px" }}>
                  <div className="text-xs tracking-[0.4em] font-semibold uppercase mb-2" style={{ color: "rgba(212,175,55,0.65)" }}>
                    {occ.label}
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-xs font-light tracking-wide group-hover:gap-2 transition-all"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Explore vendors <ArrowRight size={10} style={{ color: "rgba(212,175,55,0.55)" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: PLANNING GUIDES ───────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
                Expert Planning Guides
              </p>
              <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                Plan With Confidence
              </h2>
            </div>
            <Link
              href="/guides"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors font-light"
            >
              All guides <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Accent strip */}
                <div className="h-1.5" style={{ background: guide.accent }} />
                <div className="p-7 flex flex-col flex-1">
                  <div
                    className="text-xs tracking-[0.3em] font-semibold uppercase mb-4"
                    style={{ color: "rgba(11,31,77,0.35)" }}
                  >
                    {guide.category}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 leading-snug mb-3 flex-1">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed mb-5">{guide.desc}</p>
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all duration-200"
                    style={{ color: "#0B1F4D" }}
                  >
                    Read guide <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            ))}

            {/* "All Guides" card */}
            <Link
              href="/guides"
              className="group rounded-2xl overflow-hidden border border-dashed border-gray-200 hover:border-gray-400 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center"
              style={{ background: "#fafaf9" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(11,31,77,0.06)" }}
              >
                <BookOpen size={20} style={{ color: "#0B1F4D" }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">All Planning Guides</h3>
              <p className="text-sm text-gray-400 font-light">
                More expert guides for every event type and budget.
              </p>
              <div className="flex items-center gap-1.5 mt-5 text-xs font-semibold text-gray-500 group-hover:gap-2.5 transition-all">
                Browse all <ArrowRight size={10} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: THE PORTFOLIO (real vendor media) ────────────── */}
      <section style={{ background: "#06111d" }} className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "rgba(212,175,55,0.45)" }}>
                The Portfolio
              </p>
              <h2 className="text-3xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                Real Work from Verified Professionals
              </h2>
              <p className="text-sm font-light mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                Every photo and video is uploaded by a vendor who has been individually reviewed by ELBOLD.
              </p>
            </div>
            {items.length > 0 && (
              <div className="flex gap-6 text-center flex-shrink-0">
                {[
                  { value: imageCount, label: "photos" },
                  { value: videoCount, label: "videos" },
                  { value: vendorCount, label: "vendors" },
                ].filter(({ value }) => value > 0).map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-light" style={{ color: "#D4AF37" }}>{value}</div>
                    <div className="text-xs font-light" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {items.length > 0 ? (
          <ShowcaseGrid items={items} />
        ) : (
          <div className="max-w-6xl mx-auto px-4 pb-16 text-center">
            <div
              className="rounded-2xl py-20 px-8 border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(212,175,55,0.07)" }}
            >
              <Camera size={36} style={{ color: "rgba(212,175,55,0.3)", margin: "0 auto 20px" }} />
              <h3 className="text-lg font-light mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                Vendor portfolios uploading now
              </h3>
              <p className="text-sm font-light max-w-sm mx-auto mb-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                Verified vendors are building their portfolios. Browse vendor profiles to see their work directly.
              </p>
              <Link href="/browse" className="btn-luxury text-sm">
                Browse Vendors <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 5: CTA PANEL ─────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* For customers */}
            <div className="rounded-2xl p-8" style={{ background: "#0B1F4D" }}>
              <div className="flex items-center gap-2 mb-5">
                <Shield size={14} style={{ color: "rgba(212,175,55,0.7)" }} />
                <p className="text-xs tracking-[0.25em] font-semibold uppercase" style={{ color: "rgba(212,175,55,0.7)" }}>
                  For Customers
                </p>
              </div>
              <h3 className="text-2xl font-light mb-3 tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                Ready to start planning?
              </h3>
              <p className="font-light text-sm leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.45)" }}>
                Browse our full marketplace of verified professionals. Get quotes, compare packages, and book with confidence.
              </p>
              <Link href="/browse" className="btn-luxury text-sm py-3 px-7">
                Browse Professionals <ArrowRight size={14} />
              </Link>
            </div>

            {/* For vendors */}
            <div className="rounded-2xl p-8 border" style={{ background: "#fafaf9", borderColor: "#e5e5e4" }}>
              <div className="flex items-center gap-2 mb-5">
                <Camera size={14} style={{ color: "rgba(11,31,77,0.5)" }} />
                <p className="text-xs tracking-[0.25em] font-semibold uppercase" style={{ color: "rgba(11,31,77,0.4)" }}>
                  For Vendors
                </p>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3 tracking-tight">
                Showcase your work here.
              </h3>
              <p className="font-light text-sm text-gray-500 leading-relaxed mb-7">
                Apply for a free vendor profile. Upload your portfolio and get discovered by customers already searching for your category.
              </p>
              <Link href="/founding-vendors" className="btn-luxury-dark text-sm py-3 px-7">
                Apply As a Vendor <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
