import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
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
  const title = `${vendor.business_name} — ${cat?.label ?? vendor.category} in ${vendor.city} | Bold Party`;
  const description = vendor.description?.slice(0, 160) ??
    `Book ${vendor.business_name}, a trusted ${cat?.label ?? vendor.category} in ${vendor.city}. Verified on Bold Party.`;

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
  const supabase = await createClient();

  const [vendorRes, authRes] = await Promise.all([
    supabase
      .from("vendors")
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, email),
        media:vendor_media(*),
        packages:vendor_packages(*),
        reviews:reviews(*, profile:profiles(full_name, avatar_url))
      `)
      .eq("id", id)
      .eq("status", "approved")
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!vendorRes.data) notFound();

  const { data: similarVendors } = await supabase
    .from("vendors")
    .select("id, business_name, category, city, rating, review_count, min_price, verified, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .eq("category", vendorRes.data.category)
    .neq("id", id)
    .gte("rating", 4.0)
    .order("rating", { ascending: false })
    .limit(4);

  const vendor = vendorRes.data;

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
    "url": `https://boldparty.co.uk/vendors/${id}`,
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
    <div className="min-h-screen">
      <Navbar user={profile} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pt-16">
        <VendorProfileView vendor={vendor} currentUser={profile} />

        {/* Similar vendors */}
        {(similarVendors?.length ?? 0) > 0 && (
          <section className="py-12 px-4 border-t border-white/8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-6">
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
                      className="glass-card overflow-hidden card-hover group"
                    >
                      <div className="relative h-32 bg-white/5 overflow-hidden">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {v.verified && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 size={14} className="text-brand-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                          {v.business_name}
                        </h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <MapPin size={9} /> {v.city}
                          </span>
                          {v.rating > 0 && (
                            <span className="text-xs text-white flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              {v.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {v.min_price && (
                          <div className="text-xs text-slate-500 mt-1">
                            From <span className="text-white font-semibold">£{v.min_price.toLocaleString()}</span>
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
