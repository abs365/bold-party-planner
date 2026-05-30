import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VendorMarketplace } from "@/components/vendor/VendorMarketplace";
import { TrendingVendors } from "@/components/ui/TrendingVendors";
import type { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "Browse Event Vendors",
  description: "Find and book verified DJs, caterers, photographers, decorators and more for your event. Search by category, location and budget across the UK.",
  openGraph: {
    title: "Browse Event Vendors | ELBOLD Events",
    description: "Find and book verified event vendors across the UK.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ELBOLD Events – Browse Verified Event Vendors",
        type: "image/png",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

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
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.search) query = query.ilike("business_name", `%${params.search}%`);
  if (params.verified_only === "true") query = query.eq("verified", true);
  if (params.min_rating) query = query.gte("rating", parseFloat(params.min_rating));
  if (params.budget_min) query = query.gte("max_price", parseFloat(params.budget_min));
  if (params.budget_max) query = query.lte("min_price", parseFloat(params.budget_max));

  const { data: vendors } = await query.limit(80);

  const trendingVendors = ((vendors ?? []) as Vendor[])
    .filter((v) => (v.rating ?? 0) >= 4.5 && (v.review_count ?? 0) >= 5)
    .sort((a, b) => {
      const sA = (a.rating ?? 0) * 6 + (a.review_count ?? 0) * 0.5 + (a.featured ? 8 : 0);
      const sB = (b.rating ?? 0) * 6 + (b.review_count ?? 0) * 0.5 + (b.featured ? 8 : 0);
      return sB - sA;
    })
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* Navy page header */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-4 uppercase"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            ELBOLD Events
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light tracking-tight mb-3"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            {params.category
              ? `${params.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}s`
              : "Browse Vendors"}
          </h1>
          <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.4)" }}>
            {params.search
              ? `Results for "${params.search}"`
              : params.city
              ? `Vendors in ${params.city}`
              : "Verified event professionals across the United Kingdom"}
          </p>
        </div>
      </div>

      <div>
        {!params.category && !params.search && !params.city && trendingVendors.length > 0 && (
          <TrendingVendors vendors={trendingVendors} />
        )}
        <VendorMarketplace
          vendors={(vendors ?? []) as Vendor[]}
          initialCategory={params.category}
          initialCity={params.city}
          initialSearch={params.search}
          initialBudgetMin={params.budget_min ? parseFloat(params.budget_min) : undefined}
          initialBudgetMax={params.budget_max ? parseFloat(params.budget_max) : undefined}
          initialMinRating={params.min_rating ? parseFloat(params.min_rating) : undefined}
          initialVerifiedOnly={params.verified_only === "true"}
          initialEventType={params.event_type}
        />
      </div>
      <Footer />
    </div>
  );
}
