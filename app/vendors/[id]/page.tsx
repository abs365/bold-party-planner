import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VendorProfileView } from "@/components/vendor/VendorProfileView";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";
import { Star, CheckCircle2, MapPin } from "lucide-react";

const SIMILAR_VENDOR_FALLBACK: Partial<Record<VendorCategory, string>> = {
  photographer:      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=400&q=60",
  dj:                "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=400&q=60",
  decorator:         "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=400&q=60",
  caterer:           "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=60",
  cake_maker:        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=400&q=60",
  mc:                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=60",
  live_band:         "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=60",
  marquee_rental:    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=60",
  balloon_decorator: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=60",
  videographer:      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=60",
  makeup_artist:     "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=400&q=60",
  event_planner:     "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=60",
  luxury_services:   "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=60",
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, category, city, bio, rating, review_count")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!vendor) return { title: "Vendor Not Found" };

  const cat = VENDOR_CATEGORIES[vendor.category as keyof typeof VENDOR_CATEGORIES];
  const title = `${vendor.business_name} | ${cat?.label ?? vendor.category} in ${vendor.city} | Elbold`;
  const description = (vendor as { bio?: string }).bio?.slice(0, 160) ??
    `Book ${vendor.business_name}, a trusted ${cat?.label ?? vendor.category} in ${vendor.city}. Verified on Elbold.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/icons/icon-512.png", alt: title }],
    },
  };
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const adminDb = await createAdminClient();

  const [vendorRes, authRes, reviewsRes] = await Promise.all([
    adminDb
      .from("vendors")
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url),
        media:vendor_media(id, url, type, is_cover, caption, sort_order, moderation_status, alt_text, width, height, duration_secs),
        packages:vendor_packages(id, name, description, price, duration_hours, includes, is_popular)
      `)
      .eq("id", id)
      .eq("status", "approved")
      .single(),
    supabase.auth.getUser(),
    adminDb
      .from("reviews")
      .select("id, rating, comment, created_at, response, response_at, profile:profiles(full_name, avatar_url)")
      .eq("vendor_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!vendorRes.data) notFound();

  const vendorWithReviews = { ...vendorRes.data, reviews: reviewsRes.data ?? [] };

  const { data: similarVendors } = await adminDb
    .from("vendors")
    .select("id, business_name, category, city, rating, review_count, min_price, verified, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .eq("category", vendorRes.data.category)
    .neq("id", id)
    .gte("rating", 4.0)
    .order("rating", { ascending: false })
    .limit(4);

  const vendor = vendorWithReviews;

  let profile = null;
  if (authRes.data.user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", authRes.data.user.id).single();
    profile = data;
  }

  const cat = VENDOR_CATEGORIES[vendor.category as keyof typeof VENDOR_CATEGORIES];
  const avgRating = (vendor.reviews as { rating: number }[] ?? []).length > 0
    ? (vendor.reviews as { rating: number }[]).reduce((s: number, r: { rating: number }) => s + r.rating, 0) / (vendor.reviews as { rating: number }[]).length
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": vendor.business_name,
    "description": (vendor as { bio?: string }).bio ?? undefined,
    "url": `https://www.elbold.com/vendors/${id}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": vendor.city,
      "addressCountry": "GB",
    },
    "priceRange": vendor.min_price ? `From £${vendor.min_price}` : undefined,
    "telephone": vendor.phone ?? undefined,
    "aggregateRating": avgRating && (vendor.review_count ?? 0) > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": vendor.review_count ?? (vendor.reviews as unknown[]).length,
      "bestRating": "5",
      "worstRating": "1",
    } : undefined,
    "sameAs": vendor.website_url ? [vendor.website_url] : undefined,
    "keywords": `${cat?.label}, event vendor, ${vendor.city}, UK event planning`,
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} lightBg />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pt-16">
        <VendorProfileView vendor={vendor} currentUser={profile} />

        {/* Similar vendors */}
        {(similarVendors?.length ?? 0) > 0 && (
          <section className="py-12 px-4 border-t border-gray-100">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                More {cat?.label ?? "Vendors"} Near You
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(similarVendors ?? []).map((v) => {
                  const vcat = VENDOR_CATEGORIES[v.category as keyof typeof VENDOR_CATEGORIES];
                  const cover = (v.media as Array<{ url: string; type: string; is_cover: boolean }> | null)
                    ?.find((m) => m.is_cover && m.type === "image") ??
                    (v.media as Array<{ url: string; type: string }> | null)?.find((m) => m.type === "image");
                  return (
                    <Link
                      key={v.id}
                      href={`/vendors/${v.id}`}
                      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="relative h-44 bg-gray-100 overflow-hidden">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt={v.business_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <Image
                            src={SIMILAR_VENDOR_FALLBACK[v.category as VendorCategory] ?? "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=60"}
                            alt={vcat?.label ?? v.category}
                            fill
                            className="object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {v.verified && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 size={14} className="text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">
                          {v.business_name}
                        </h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <MapPin size={9} /> {v.city}
                          </span>
                          {v.rating > 0 && (
                            <span className="text-xs text-gray-700 flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              {v.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {v.min_price && (
                          <div className="text-xs text-gray-400 mt-1">
                            From <span className="text-gray-900 font-semibold">£{v.min_price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
