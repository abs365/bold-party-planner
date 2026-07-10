import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowRight, Star, CheckCircle, MapPin, Shield, Award,
  Camera, Music, Sparkles, UtensilsCrossed, Building2, Mic2,
} from "lucide-react";
import { VENDOR_CATEGORIES } from "@/types";
import type { Vendor } from "@/types";
import { TEST_VENDOR_EXCLUSION } from "@/lib/test-vendors";

export const metadata: Metadata = {
  title: "Elbold | Trusted Professionals Across the UK",
  description:
    "The UK marketplace for trusted, verified professionals. Every professional individually reviewed before joining. Every booking protected. Every review from a real, confirmed booking.",
  openGraph: {
    title: "Elbold | Trusted Professionals Across the UK",
    description:
      "Every professional individually reviewed. Every payment protected. Every review from a real, confirmed booking.",
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elbold | Trusted Professionals Across the UK",
    description: "Verified professionals across the UK. Every professional individually reviewed before joining.",
    images: ["/icons/icon-512.png"],
  },
};

export const dynamic = "force-dynamic";

type FeaturedVendor = Pick<
  Vendor,
  "id" | "business_name" | "category" | "city" | "rating" | "review_count" |
  "starting_price" | "subscription_plan" | "verified" | "min_price" | "verification_level" |
  "is_founding_vendor"
> & { media?: Array<{ url: string; type: string; is_cover: boolean }> };

const OCCASIONS = [
  {
    label: "Weddings",
    href: "/browse?event=wedding",
    photo: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(160deg, #1a0610 0%, #3d1030 60%, #200a1e 100%)",
    overlay: "rgba(8,3,12,0.38)",
  },
  {
    label: "Birthdays",
    href: "/browse?event=birthday",
    photo: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(160deg, #0a0820 0%, #1a1060 60%, #0f0840 100%)",
    overlay: "rgba(4,4,20,0.38)",
  },
  {
    label: "Corporate",
    href: "/browse?event=corporate",
    photo: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(160deg, #051020 0%, #0d2040 60%, #091836 100%)",
    overlay: "rgba(2,6,14,0.38)",
  },
  {
    label: "Baby Showers",
    href: "/browse?event=baby_shower",
    photo: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(160deg, #0a1810 0%, #142b1a 60%, #0d2014 100%)",
    overlay: "rgba(4,10,6,0.38)",
  },
  {
    label: "Anniversaries",
    href: "/browse?event=anniversary",
    photo: "https://images.unsplash.com/photo-1516589091380-5d8259b23548?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(160deg, #1a0810 0%, #3a0e20 60%, #240a18 100%)",
    overlay: "rgba(12,4,8,0.38)",
  },
  {
    label: "Cultural Celebrations",
    href: "/browse?event=cultural",
    photo: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(160deg, #140820 0%, #281050 60%, #1a0838 100%)",
    overlay: "rgba(8,4,18,0.38)",
  },
];

const QUICK_STARTS = [
  { label: "Weddings",        href: "/browse?event=wedding" },
  { label: "Birthdays",       href: "/browse?event=birthday" },
  { label: "Corporate",       href: "/browse?event=corporate" },
  { label: "Cultural Events", href: "/browse?event=cultural" },
  { label: "Baby Showers",    href: "/browse?event=baby_shower" },
];

const CATEGORIES = [
  { label: "Photographers", icon: Camera,         href: "/browse?category=photographer" },
  { label: "DJs & Music",   icon: Music,           href: "/browse?category=dj" },
  { label: "Decorators",    icon: Sparkles,        href: "/browse?category=decorator" },
  { label: "Catering",      icon: UtensilsCrossed, href: "/browse?category=caterer" },
  { label: "Live Music",    icon: Mic2,            href: "/browse?category=live_band" },
  { label: "Venues",        icon: Building2,       href: "/browse?category=venue_hire" },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Tell us about your event",
    desc: "Enter your event date, type, budget and location. Takes two minutes. Our Smart Planner suggests the right vendors for you.",
  },
  {
    n: "02",
    title: "Request free quotes from verified professionals",
    desc: "Send your brief to photographers, DJs, caterers and more. Every vendor is individually reviewed before they appear. No obligation.",
  },
  {
    n: "03",
    title: "Compare and book with confidence",
    desc: "Review quotes side by side, read verified reviews, and choose the one that fits. Pay a 30% deposit through Stripe. The rest is due after your event.",
  },
  {
    n: "04",
    title: "Manage everything in your dashboard",
    desc: "Track all your vendors, payments, and bookings in one place. Your event hub keeps you organised from first quote to the day itself.",
  },
];

const VENDOR_BENEFITS = [
  {
    title: "A business platform, not just a listing",
    desc: "A CRM, verified profile, availability calendar and analytics dashboard are yours from day one — real business tools most event professionals have never had access to.",
  },
  {
    title: "Reach customers actively planning events, not scrolling a feed",
    desc: "Every visitor on Elbold is searching for a vendor for a specific occasion. These are buyers, not browsers.",
  },
  {
    title: "A fair, transparent share on every marketplace booking",
    desc: "A clear commission applies to bookings that come through Elbold — no hidden platform fees, and it's only ever charged on a booking you've actually been paid for.",
  },
  {
    title: "A verified badge that social media cannot provide",
    desc: "Our verification process gives customers documented proof that you are a reviewed, legitimate professional.",
  },
  {
    title: "Reviews that only come from real, confirmed bookings",
    desc: "Your reputation is protected. No anonymous comments. Every review is tied to a completed booking.",
  },
];

const JSONLD_ORGANIZATION = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.elbold.com/#organization",
      name: "Elbold",
      url: "https://www.elbold.com",
      logo: { "@type": "ImageObject", url: "https://www.elbold.com/brand/elbold-logo-final.svg" },
      description: "The United Kingdom's trusted marketplace for verified professionals.",
      address: { "@type": "PostalAddress", addressCountry: "GB" },
      areaServed: { "@type": "Country", name: "United Kingdom" },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.elbold.com/#website",
      url: "https://www.elbold.com",
      name: "Elbold",
      publisher: { "@id": "https://www.elbold.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://www.elbold.com/browse?search={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const [featuredRes, vendorCountRes] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, business_name, category, city, rating, review_count, starting_price, subscription_plan, verified, min_price, verification_level, is_founding_vendor, media:vendor_media(url, type, is_cover)")
      .eq("status", "approved")
      .not("id", "in", TEST_VENDOR_EXCLUSION)
      .order("subscription_plan", { ascending: false })
      .order("rating", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(6),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "approved").not("id", "in", TEST_VENDOR_EXCLUSION),
  ]);

  const vendors = (featuredRes.data ?? []) as FeaturedVendor[];
  const vendorCount = vendorCountRes.count ?? 0;

  return (
    <>
      <Script
        id="jsonld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_ORGANIZATION) }}
      />

      <div className="min-h-screen bg-white">
        <Navbar user={profile} lightBg />

        {/* ── SECTION 1: TYPOGRAPHIC HERO ──────────────────────────────────── */}
        <section className="pt-32 pb-20 px-4" style={{ background: "#ffffff" }}>
          <div className="max-w-4xl mx-auto text-center">

            {/* Brand line */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-10" style={{ background: "rgba(11,31,77,0.15)" }} />
              <span
                className="text-xs tracking-[0.45em] font-medium uppercase"
                style={{ color: "rgba(11,31,77,0.45)" }}
              >
                Trusted Professionals &middot; United Kingdom
              </span>
              <div className="h-px w-10" style={{ background: "rgba(11,31,77,0.15)" }} />
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.06] mb-6"
              style={{ color: "#0B1F4D" }}
            >
              Find Trusted Professionals
              <br />
              <span style={{ color: "#D4AF37" }}>For Every Occasion</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-base sm:text-lg font-light leading-relaxed max-w-xl mx-auto mb-10"
              style={{ color: "#6b7280" }}
            >
              Tell us about your event. Receive free quotes from verified photographers, DJs,
              caterers and more. Compare, choose and book. Every payment is protected.
            </p>

            {/* CTAs — Browse is primary: it's the only path with no signup wall,
                so a first-time visitor can see real vendors before being asked
                to commit. "Plan My Event" (guided multi-vendor planning) is
                secondary since it requires an account. Vendor recruitment is
                deliberately not in this row - it competes with the customer
                decision this hero exists to drive; it has its own section
                further down the page. */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "#0B1F4D", color: "#ffffff", border: "2px solid #0B1F4D" }}
              >
                Browse Vendors <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard/create-event"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-80"
                style={{ border: "2px solid #0B1F4D", color: "#0B1F4D", background: "transparent" }}
              >
                Plan My Event
              </Link>
            </div>

            {/* Trust/no-risk reassurance - replaces a prior line about vendor
                onboarding status, which spoke to supply-side ops rather than
                the customer's actual decision */}
            <p
              className="text-xs font-light mb-10 tracking-wide"
              style={{ color: "rgba(11,31,77,0.42)" }}
            >
              Free to use &middot; No obligation to book &middot; Every payment protected
            </p>

            {/* Occasion chips */}
            <div className="flex flex-col items-center gap-3">
              <span
                className="text-xs tracking-[0.3em] font-medium uppercase"
                style={{ color: "rgba(11,31,77,0.35)" }}
              >
                What are you planning?
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {QUICK_STARTS.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-xs px-4 py-2 rounded-full border font-medium transition-all hover:bg-[#0B1F4D] hover:text-white"
                    style={{
                      borderColor: "rgba(11,31,77,0.2)",
                      color: "#0B1F4D",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: HOW IT WORKS ──────────────────────────────────────── */}
        <section className="py-20 px-4" style={{ background: "#f8f7f5", borderTop: "1px solid rgba(11,31,77,0.06)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase"
                style={{ color: "#D4AF37" }}
              >
                How It Works
              </p>
              <h2
                className="text-3xl font-light tracking-tight"
                style={{ color: "#0B1F4D" }}
              >
                From your first idea to event day, in four steps.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS.map(({ n, title, desc }) => (
                <div key={n} className="relative">
                  <div
                    className="text-5xl font-light mb-5 leading-none"
                    style={{ color: "rgba(11,31,77,0.08)" }}
                  >
                    {n}
                  </div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: "#0B1F4D" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "#0B1F4D" }}
              >
                Read how it works in full <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: CATEGORY GRID ─────────────────────────────────────── */}
        <section className="pb-20 px-4" style={{ background: "#ffffff" }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="text-xs tracking-[0.35em] font-semibold mb-1.5 uppercase" style={{ color: "#C9A84C" }}>
                  Browse by Category
                </p>
                <h2 className="text-2xl font-light tracking-tight" style={{ color: "#0B1F4D" }}>
                  What are you looking for?
                </h2>
              </div>
              <Link
                href="/browse"
                className="hidden sm:flex items-center gap-1 text-xs font-medium hover:opacity-60 transition-opacity"
                style={{ color: "rgba(11,31,77,0.45)" }}
              >
                All categories <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {CATEGORIES.map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex flex-col items-center gap-3.5 p-5 rounded-xl border transition-all duration-200 hover:border-[#0B1F4D] hover:shadow-md hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(11,31,77,0.12)", background: "#ffffff" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:bg-[#0B1F4D] group-hover:scale-105"
                    style={{ background: "rgba(11,31,77,0.06)" }}
                  >
                    <Icon size={20} className="text-[#0B1F4D] group-hover:text-white transition-colors" />
                  </div>
                  <span
                    className="text-xs font-semibold text-center leading-tight"
                    style={{ color: "#0B1F4D" }}
                  >
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: TRUST BAR ─────────────────────────────────────────── */}
        <section style={{ background: "#f8f7f5", borderTop: "1px solid rgba(11,31,77,0.06)", borderBottom: "1px solid rgba(11,31,77,0.06)" }}>
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { icon: CheckCircle, label: "Every vendor reviewed by us" },
                { icon: Star,         label: "Reviews from real bookings only" },
                { icon: Shield,       label: "Payments secured through Stripe" },
                { icon: Award,        label: "Full refund if vendor cancels" },
                { icon: MapPin,       label: "Based in the United Kingdom" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center justify-center gap-2.5 py-1">
                  <Icon size={14} style={{ color: "#0B1F4D", opacity: 0.7, flexShrink: 0 }} />
                  <span className="text-xs font-light" style={{ color: "#374151" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: OCCASION SHOWCASE — editorial photography cards ───── */}
        <section style={{ background: "#f8f7f5" }} className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
                Every Celebration Covered
              </p>
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight">
                What Are You Celebrating?
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OCCASIONS.map((occasion) => (
                <Link
                  key={occasion.label}
                  href={occasion.href}
                  className="group relative rounded-2xl overflow-hidden"
                  style={{
                    background: occasion.gradient,
                    minHeight: "320px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="absolute inset-0">
                    <Image
                      src={occasion.photo}
                      alt={occasion.label}
                      fill
                      quality={75}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, rgba(4,8,20,0.70) 0%, ${occasion.overlay} 45%, rgba(4,8,20,0.04) 100%)`,
                    }}
                  />

                  <div
                    className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at top right, rgba(212,175,55,0.12) 0%, transparent 65%)",
                    }}
                  />

                  <div className="relative z-10 p-8 h-full flex flex-col justify-end" style={{ minHeight: "320px" }}>
                    <div
                      className="text-xs tracking-[0.4em] font-semibold uppercase mb-3"
                      style={{ color: "rgba(212,175,55,0.65)" }}
                    >
                      {occasion.label}
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs font-light tracking-wide group-hover:gap-3 transition-all duration-200"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      Find Professionals <ArrowRight size={11} style={{ color: "rgba(212,175,55,0.6)" }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/browse"
                className="text-sm font-light text-gray-400 hover:text-gray-700 flex items-center gap-1.5 justify-center transition-colors"
              >
                Browse all 20+ vendor categories <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FEATURED VENDORS ──────────────────────────────────── */}
        {vendors.length > 0 && (
          <section className="py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
                    Approved Professionals
                  </p>
                  <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                    Trusted by Elbold
                  </h2>
                </div>
                <Link
                  href="/browse"
                  className="text-sm text-gray-400 hover:text-gray-900 flex items-center gap-1.5 transition-colors font-light"
                >
                  View all <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {vendors.map((v) => {
                  const cat = VENDOR_CATEGORIES[v.category as keyof typeof VENDOR_CATEGORIES];
                  const coverMedia =
                    v.media?.find((m) => m.is_cover && m.type === "image") ??
                    v.media?.find((m) => m.type === "image");
                  const verLevel = v.verification_level ?? 0;

                  return (
                    <Link
                      key={v.id}
                      href={`/vendors/${v.id}`}
                      className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative h-56 overflow-hidden">
                        {coverMedia ? (
                          <Image
                            src={coverMedia.url}
                            alt={v.business_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #0B1F4D, #162447)" }}
                          >
                            <span className="text-xs tracking-widest font-semibold" style={{ color: "rgba(212,175,55,0.4)" }}>Elbold</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          {v.subscription_plan === "featured" && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ background: "#D4AF37", color: "#0B1F4D" }}>
                              Featured
                            </span>
                          )}
                          {verLevel >= 2 && (
                            <span className="badge bg-white/15 border border-white/20 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                              <Shield size={9} />
                              {verLevel >= 4 ? "Premium Partner" : verLevel >= 3 ? "Trusted Pro" : "ID Verified"}
                            </span>
                          )}
                        </div>

                        {(v.starting_price ?? 0) > 0 && (
                          <div className="absolute bottom-3 right-3 bg-black/55 px-2.5 py-1 rounded backdrop-blur-sm">
                            <span className="text-xs text-white/60">From </span>
                            <span className="text-sm font-semibold text-white">
                              {(v.starting_price ?? 0).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{v.business_name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-gray-400 capitalize font-light">{cat?.label ?? v.category}</p>
                          {v.is_founding_vendor && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium" style={{ borderColor: "#0B1F4D", color: "#0B1F4D" }}>
                              <Award size={9} /> Founding Vendor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-gray-400 font-light">
                            <MapPin size={10} /> {v.city}
                          </div>
                          {(v.rating ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span className="text-xs font-semibold text-gray-700">{(v.rating ?? 0).toFixed(1)}</span>
                              {(v.review_count ?? 0) > 0 && (
                                <span className="text-xs text-gray-400 font-light">({v.review_count})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {vendorCount > vendors.length && (
                <div className="text-center mt-10">
                  <Link href="/browse" className="btn-luxury-dark text-sm">
                    Browse All{vendorCount > 0 ? ` ${vendorCount}` : ""} Professionals <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SECTION 6: CONCIERGE BAND ────────────────────────────────────── */}
        <section className="py-16 px-4" style={{ background: "#f8f7f5" }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
                  Concierge Planning
                </p>
                <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-4">
                  Not sure where to start?<br />Tell us about your event.
                </h2>
                <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">
                  If you would rather not browse on your own, submit your event details and a member of the Elbold team will personally recommend the right vendors for you. We respond within 24 hours and there is no obligation to book.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/concierge"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                    style={{ background: "#0D1B3E", color: "#C9A84C", border: "2px solid #C9A84C" }}
                  >
                    Request Help Planning My Event <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: "01", text: "Tell us your event type, date and budget" },
                  { n: "02", text: "We identify verified vendors who fit your needs" },
                  { n: "03", text: "You receive personalised recommendations" },
                  { n: "04", text: "You choose who to contact. No pressure." },
                ].map(({ n, text }) => (
                  <div key={n} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="text-xs font-bold tracking-wider mb-2" style={{ color: "#C9A84C" }}>{n}</div>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 8: THE ELBOLD PROMISE ────────────────────────────────── */}
        <section className="py-24 px-4" style={{ background: "#0B1F4D" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase"
                style={{ color: "rgba(212,175,55,0.5)" }}
              >
                The Elbold Promise
              </p>
              <h2
                className="text-3xl font-light tracking-tight mb-4"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                A marketplace built on one principle.
                <br />
                <span style={{ color: "#D4AF37" }}>You should be able to trust it.</span>
              </h2>
              <p
                className="text-sm font-light max-w-xl mx-auto leading-relaxed"
                style={{ color: "rgba(255,255,255,0.42)" }}
              >
                No vendor joins Elbold automatically. No review is unverified. No payment is unprotected.
                These are not aspirations. They are the rules the platform operates by.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
              {[
                {
                  icon: CheckCircle,
                  title: "Every vendor reviewed by a human",
                  body: "Every application is assessed by our team against published standards before a profile goes live. No automation. No auto-approval.",
                },
                {
                  icon: Shield,
                  title: "Your deposit is protected by Stripe",
                  body: "A 30% deposit secures your booking. All payments are processed by Stripe. Funds are held until your event is complete.",
                },
                {
                  icon: Star,
                  title: "Reviews only from confirmed bookings",
                  body: "You cannot leave a review on Elbold unless you have completed a booking through the platform. No anonymous reviews.",
                },
                {
                  icon: Award,
                  title: "Full refund if your vendor cancels",
                  body: "If your vendor cancels a confirmed booking, you receive a full refund of everything you have paid, with no dispute required.",
                },
                {
                  icon: MapPin,
                  title: "United Kingdom professionals only",
                  body: "Every vendor on Elbold operates in the UK. We verify that the person listing the service is the actual service provider.",
                },
                {
                  icon: ArrowRight,
                  title: "Our standards are published and enforced",
                  body: "Vendor approval criteria, warning procedures, and removal policies are all publicly documented. We hold ourselves to the same standard.",
                  link: "/vendor-standards",
                },
              ].map(({ icon: Icon, title, body, link }) => (
                <div
                  key={title}
                  className="rounded-xl p-6"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}
                >
                  <Icon size={18} style={{ color: "#D4AF37", marginBottom: "14px" }} />
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {title}
                  </h3>
                  <p className="text-xs font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {body}
                  </p>
                  {link && (
                    <Link
                      href={link}
                      className="inline-flex items-center gap-1 text-xs mt-4 font-medium hover:opacity-80 transition-opacity"
                      style={{ color: "#D4AF37" }}
                    >
                      Read more <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Platform stats — always 4, designed for any growth stage */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12"
              style={{ borderTop: "1px solid rgba(212,175,55,0.07)" }}
            >
              {((): Array<{ value: string; label: string }> => {
                const base = [
                  { value: "100%",   label: "Individually Reviewed" },
                  { value: "Stripe", label: "Payments Protected" },
                  { value: "UK",     label: "Nationwide Coverage" },
                ];
                if (vendorCount >= 30) {
                  return [
                    { value: `${vendorCount}+`, label: "Verified Professionals" },
                    ...base,
                  ];
                }
                // Early stage: replace vendor count with how-we-work stat
                return [
                  ...base,
                  { value: "30%",    label: "Deposit Secures Booking" },
                ];
              })().map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div
                    className="text-3xl font-light tracking-tight mb-1"
                    style={{ color: "#D4AF37" }}
                  >
                    {value}
                  </div>
                  <div
                    className="text-xs font-light leading-snug"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 9: FOR EVENT PROFESSIONALS ───────────────────────────── */}
        <section className="py-24 px-4" style={{ background: "#f8f7f5" }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
                  For Event Professionals
                </p>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-5" style={{ color: "#0B1F4D" }}>
                  Why Join Elbold Instead of Relying on Social Media?
                </h2>
                <p className="text-gray-400 text-sm font-light leading-relaxed mb-10">
                  Instagram and Facebook are built for browsing. Elbold is built for running an
                  event business — a real CRM and analytics alongside customers who are actively
                  searching for a vendor and ready to commit.
                </p>
                <div className="space-y-7">
                  {VENDOR_BENEFITS.map((b) => (
                    <div key={b.title} className="flex gap-4">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(11,31,77,0.07)" }}
                      >
                        <CheckCircle size={12} style={{ color: "#0B1F4D" }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">{b.title}</div>
                        <div className="text-sm text-gray-400 font-light leading-relaxed">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-10" style={{ background: "#0B1F4D" }}>
                <p className="text-xs tracking-[0.35em] font-semibold mb-5 uppercase" style={{ color: "rgba(212,175,55,0.55)" }}>
                  Founding Vendor Programme
                </p>
                <h3 className="text-2xl font-light mb-5 tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                  Be part of Elbold from the beginning.
                </h3>
                <p className="text-sm font-light leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Founding vendors receive a verified profile, priority placement, and a founding badge
                  that communicates credibility to every future customer.
                </p>
                <div className="space-y-3">
                  <Link href="/founding-vendors" className="btn-luxury w-full justify-center text-sm py-4">
                    Get Listed Free <ArrowRight size={14} />
                  </Link>
                  <Link href="/how-it-works" className="btn-luxury-outline w-full justify-center text-sm py-4">
                    Learn How It Works
                  </Link>
                </div>
                <p className="text-center mt-6 text-xs font-light" style={{ color: "rgba(255,255,255,0.16)" }}>
                  Free to start. Upgrade when you&apos;re ready to grow. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 10: FINAL CTA ─────────────────────────────────────────── */}
        <section className="py-24 px-4" style={{ background: "#ffffff" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-3xl font-light tracking-tight mb-5"
              style={{ color: "#0B1F4D" }}
            >
              Every event deserves professionals
              <br />
              you can trust completely.
            </h2>
            <p className="text-base font-light mb-10" style={{ color: "#6b7280" }}>
              Every professional is individually reviewed before they join.
              Create your event, request quotes and book with complete confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/create-event"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "#0B1F4D", color: "#ffffff" }}
              >
                Plan My Event <ArrowRight size={16} />
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-80"
                style={{ border: "2px solid rgba(11,31,77,0.2)", color: "#0B1F4D" }}
              >
                Browse Professionals
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
