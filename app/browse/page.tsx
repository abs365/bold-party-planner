import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VendorMarketplace } from "@/components/vendor/VendorMarketplace";
import { TrendingVendors } from "@/components/ui/TrendingVendors";
import { ArrowRight, CheckCircle2, Shield, Star } from "lucide-react";
import type { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "Discover Verified Event Professionals | ELBOLD Events",
  description:
    "Discover and book verified DJs, photographers, caterers, decorators and entertainers for your celebration. Every vendor individually reviewed. Compare packages, read real reviews and book with Stripe-secured payments.",
  openGraph: {
    title: "Discover Verified Event Professionals | ELBOLD Events",
    description:
      "Every vendor individually reviewed before joining the platform. Browse, compare, and book with complete confidence.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

// Category discovery cards — shown on the unfiltered discovery view
const CATEGORY_DISCOVERY = [
  {
    label: "Photographers",
    sub: "Capture the moment",
    category: "photographer",
    photo: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "DJs & Music",
    sub: "Set the atmosphere",
    category: "dj",
    photo: "https://images.unsplash.com/photo-1571266028243-8b6f6e85c5ae?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Decorators",
    sub: "Transform your venue",
    category: "decorator",
    photo: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Catering",
    sub: "Exceptional food and service",
    category: "caterer",
    photo: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Marquee & Venue",
    sub: "The perfect setting",
    category: "marquee_rental",
    photo: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Live Music",
    sub: "Create the experience",
    category: "live_band",
    photo: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
  },
];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    city?: string;
    search?: string;
    budget_min?: string;
    budget_max?: string;
    min_rating?: string;
    verified_only?: string;
    event_type?: string;
    event?: string;
    theme?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  let query = supabase
    .from("vendors")
    .select("*, media:vendor_media(url, type, is_cover), packages:vendor_packages(price)")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("rating", { ascending: false });

  if (params.category) query = query.eq("category", params.category);
  if (params.city)     query = query.ilike("city", `%${params.city}%`);
  if (params.search)   query = query.ilike("business_name", `%${params.search}%`);
  if (params.verified_only === "true") query = query.eq("verified", true);
  if (params.min_rating)  query = query.gte("rating", parseFloat(params.min_rating));
  if (params.budget_min)  query = query.gte("max_price", parseFloat(params.budget_min));
  if (params.budget_max)  query = query.lte("min_price", parseFloat(params.budget_max));

  const { data: vendors } = await query.limit(80);

  const trendingVendors = ((vendors ?? []) as Vendor[])
    .filter((v) => (v.rating ?? 0) >= 4.5 && (v.review_count ?? 0) >= 5)
    .sort((a, b) => {
      const sA = (a.rating ?? 0) * 6 + (a.review_count ?? 0) * 0.5 + (a.featured ? 8 : 0);
      const sB = (b.rating ?? 0) * 6 + (b.review_count ?? 0) * 0.5 + (b.featured ? 8 : 0);
      return sB - sA;
    })
    .slice(0, 4);

  // Discovery mode = no active filters
  const isDiscovery = !params.category && !params.search && !params.city &&
    !params.budget_min && !params.budget_max && !params.min_rating &&
    params.verified_only !== "true" && !params.event && !params.event_type;

  const headerLabel = params.theme
    ? params.theme.replace(/-/g, " ") + " Inspiration"
    : params.category
    ? "Verified Professionals"
    : params.city
    ? `Vendors in ${params.city}`
    : "Trusted Event Professionals";

  const headerTitle = params.theme
    ? params.theme.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : params.category
    ? `Find the Perfect ${params.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} For Your Event`
    : params.search
    ? `Results for "${params.search}"`
    : params.city
    ? `Event Professionals in ${params.city}`
    : "Discover Trusted Professionals For Your Celebration";

  const headerDesc = params.search
    ? "Verified vendors matching your search."
    : params.city
    ? `Every vendor in ${params.city} is individually reviewed before joining the platform.`
    : "Every vendor is individually reviewed before joining the platform. Browse, compare, and book with complete confidence.";

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* ── DISCOVERY HEADER ─────────────────────────────────────────────── */}
      <div className="pt-16" style={{ background: "#0B1F4D" }}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
            {headerLabel}
          </p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>
            {headerTitle}
          </h1>
          <p className="text-sm font-light max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            {headerDesc}
          </p>
        </div>
      </div>

      {/* ── CATEGORY DISCOVERY — shown only on unfiltered landing ─────── */}
      {isDiscovery && (
        <section style={{ background: "#f8f7f5" }} className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-[0.35em] font-semibold mb-2 uppercase" style={{ color: "#C9A84C" }}>
                  Browse by Category
                </p>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
                  What are you looking for?
                </h2>
              </div>
              <Link href="/browse" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors font-light">
                All categories <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {CATEGORY_DISCOVERY.map((cat) => (
                <Link
                  key={cat.category}
                  href={`/browse?category=${cat.category}`}
                  className="group relative rounded-xl overflow-hidden"
                  style={{ minHeight: "180px", border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  {/* Photography */}
                  <div className="absolute inset-0">
                    <Image
                      src={cat.photo}
                      alt={cat.label}
                      fill
                      quality={70}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  </div>
                  {/* Overlay — bottom-heavy to anchor text, photography visible in top half */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(4,8,20,0.78) 0%, rgba(4,8,20,0.22) 55%, rgba(4,8,20,0.02) 100%)" }}
                  />
                  {/* Content */}
                  <div className="relative z-10 p-4 h-full flex flex-col justify-end" style={{ minHeight: "180px" }}>
                    <div className="text-sm font-semibold text-white leading-tight">{cat.label}</div>
                    <div
                      className="text-xs font-light mt-1 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      Browse <ArrowRight size={9} style={{ color: "rgba(212,175,55,0.6)" }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TRUST STRIP ──────────────────────────────────────────────────── */}
      {isDiscovery && (
        <div
          className="border-y"
          style={{ background: "white", borderColor: "#f0ede8" }}
        >
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: CheckCircle2,
                  title: "Individually reviewed",
                  desc: "Every vendor is reviewed by our team before they appear here. No automated approvals.",
                },
                {
                  icon: Shield,
                  title: "Stripe-secured payments",
                  desc: "Your 30% deposit is held by Stripe and only released after your event has taken place.",
                },
                {
                  icon: Star,
                  title: "Verified reviews only",
                  desc: "Reviews can only be left by customers who have made a confirmed booking through ELBOLD.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(11,31,77,0.06)" }}
                  >
                    <Icon size={14} style={{ color: "#0B1F4D" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{title}</div>
                    <div className="text-xs text-gray-400 font-light mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURED PROFESSIONALS (TrendingVendors) in dark strip ────── */}
      {!params.category && !params.search && !params.city && trendingVendors.length > 0 && (
        <div style={{ background: "#06111d" }}>
          <div className="max-w-6xl mx-auto px-4 pt-3 pb-1">
            <p className="text-xs tracking-[0.3em] font-semibold uppercase pt-8" style={{ color: "rgba(212,175,55,0.45)" }}>
              Featured This Week
            </p>
          </div>
          <TrendingVendors vendors={trendingVendors} />
        </div>
      )}

      {/* ── MARKETPLACE ──────────────────────────────────────────────────── */}
      <VendorMarketplace
        vendors={(vendors ?? []) as Vendor[]}
        initialCategory={params.category}
        initialCity={params.city}
        initialSearch={params.search}
        initialBudgetMin={params.budget_min ? parseFloat(params.budget_min) : undefined}
        initialBudgetMax={params.budget_max ? parseFloat(params.budget_max) : undefined}
        initialMinRating={params.min_rating ? parseFloat(params.min_rating) : undefined}
        initialVerifiedOnly={params.verified_only === "true"}
        initialEventType={params.event_type ?? params.event}
        initialTheme={params.theme}
      />

      <Footer />
    </div>
  );
}
