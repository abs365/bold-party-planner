import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VendorProfileView } from "@/components/vendor/VendorProfileView";
import { VENDOR_CATEGORIES } from "@/types";
import { Star, CheckCircle2, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, category, city, description, rating, review_count")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!vendor) return { title: "Vendor Not Found" };

  const cat = VENDOR_CATEGORIES[vendor.category as keyof typeof VENDOR_CATEGORIES];
  const title = `${vendor.business_name} | ${cat?.label ?? vendor.category} in ${vendor.city} | ELBOLD Events`;
  const description = vendor.description?.slice(0, 160) ??
    `Book ${vendor.business_name}, a trusted ${cat?.label ?? vendor.category} in ${vendor.city}. Verified on ELBOLD Events.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Session client: used only for auth.getUser() and the logged-in visitor's own profile.
  const supabase = await createClient();
  // Admin client: bypasses RLS for public read-only data (vendor info, review author names).
  // Required so anonymous visitors see reviewer full_name/avatar_url after migration 027
  // restricts profiles_public_read to approved vendors only.
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

  // Merge reviews into vendor object (VendorProfileView expects vendor.reviews)
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

  // JSON-LD structured data for SEO
  const cat = VENDOR_CATEGORIES[vendor.category as keyof typeof VENDOR_CATEGORIES];
  const avgRating = (vendor.reviews as { rating: number }[] ?? []).length > 0
    ? (vendor.reviews as { rating: number }[]).reduce((s: number, r: { rating: number }) => s + r.rating, 0) / (vendor.reviews as { rating: number }[]).length
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": vendor.business_name,
    "description": vendor.description ?? undefined,
    "url": `https://elbold.com/vendors/${id}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": vendor.city,
      "addressCountry": "GB",
    },
    "priceRange": vendor.starting_price ? `From £${vendor.starting_price}` : undefined,
    "telephone": vendor.phone ?? undefined,
    "aggregateRating": avgRating && (vendor.review_count ?? 0) > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": vendor.review_count ?? (vendor.reviews as unknown[]).length,
      "bestRating": "5",
      "worstRating": "1",
    } : undefined,
    "sameAs": vendor.website ? [vendor.website] : undefined,
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">
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
                      <div className="relative h-32 bg-gray-100 overflow-hidden">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt={v.business_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {vcat?.icon ?? "🎉"}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {v.verified && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 size={14} className="text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
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
