import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Star, Shield, MapPin, CheckCircle2 } from "lucide-react";
import { VENDOR_CATEGORIES } from "@/types";
import type { Vendor } from "@/types";

type LocationVendor = Pick<
  Vendor,
  "id" | "business_name" | "category" | "city" | "rating" | "review_count" |
  "starting_price" | "subscription_plan" | "verified" | "verification_level"
> & {
  media?: Array<{ url: string; type: string; is_cover: boolean }>;
};

const LOCATION_DATA: Record<string, {
  title: string;
  description: string;
  county: string;
  areas: string[];
  popular: string[];
}> = {
  essex: {
    title: "Essex",
    description: "Find trusted event professionals across Essex, from Chelmsford to Brentwood, Colchester to Southend.",
    county: "Essex",
    areas: ["Chelmsford", "Brentwood", "Colchester", "Southend-on-Sea", "Basildon", "Romford"],
    popular: ["Wedding Photographers", "DJs", "Decorators", "Caterers"],
  },
  kent: {
    title: "Kent",
    description: "Book verified event vendors across Kent: Maidstone, Canterbury, Tunbridge Wells and beyond.",
    county: "Kent",
    areas: ["Maidstone", "Canterbury", "Tunbridge Wells", "Folkestone", "Margate", "Gravesend"],
    popular: ["Wedding Photographers", "Caterers", "Florists", "Entertainment"],
  },
  london: {
    title: "London",
    description: "Discover premium event professionals across London, from intimate venues to grand celebrations.",
    county: "London",
    areas: ["Central London", "East London", "North London", "South London", "West London", "City of London"],
    popular: ["Photographers", "DJs", "Caterers", "Venues", "Decorators"],
  },
};

const CATEGORY_DATA: Record<string, { label: string; description: string; keywords: string[] }> = {
  djs: {
    label: "DJs",
    description: "Professional DJs for weddings, birthdays, corporate events and celebrations.",
    keywords: ["wedding DJ", "party DJ", "corporate DJ", "mobile DJ"],
  },
  photographers: {
    label: "Photographers",
    description: "Professional photographers for weddings, portraits, events and commercial shoots.",
    keywords: ["wedding photographer", "event photographer", "portrait photographer"],
  },
  caterers: {
    label: "Caterers",
    description: "Professional catering for weddings, corporate events, private parties and celebrations.",
    keywords: ["wedding caterer", "event catering", "corporate catering", "private chef"],
  },
};

export function buildLocationMetadata(location: string, category?: string): Metadata {
  const loc = LOCATION_DATA[location];
  if (!loc) return { title: "Event Vendors | ELBOLD Events" };

  if (category) {
    const cat = CATEGORY_DATA[category];
    if (!cat) return { title: `Event Vendors in ${loc.title} | ELBOLD Events` };
    return {
      title: `${cat.label} in ${loc.title} | Verified Event Professionals | ELBOLD Events`,
      description: `Book trusted, verified ${cat.label.toLowerCase()} in ${loc.title}. ${cat.description} Every professional reviewed by ELBOLD.`,
    };
  }

  return {
    title: `Event Vendors in ${loc.title} | Weddings, Birthdays & Corporate Events | ELBOLD Events`,
    description: `${loc.description} Book verified DJs, photographers, caterers, decorators and more. Every vendor individually reviewed.`,
  };
}

export async function LocationPage({
  location,
  category,
}: {
  location: string;
  category?: string;
}) {
  const loc = LOCATION_DATA[location];
  const cat = category ? CATEGORY_DATA[category] : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  let query = supabase
    .from("vendors")
    .select("id, business_name, category, city, rating, review_count, starting_price, subscription_plan, verified, verification_level, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .ilike("city", `%${loc?.county ?? location}%`)
    .order("rating", { ascending: false })
    .limit(24);

  if (category === "djs") query = query.eq("category", "dj");
  else if (category === "photographers") query = query.eq("category", "photographer");
  else if (category === "caterers") query = query.eq("category", "caterer");

  const { data: vendors } = await query;
  const allVendors = (vendors ?? []) as LocationVendor[];

  const pageTitle = cat
    ? `${cat.label} in ${loc?.title}`
    : `Event Vendors in ${loc?.title}`;

  const pageDesc = cat
    ? `Book trusted, verified ${cat.label.toLowerCase()} in ${loc?.title}. Every professional individually reviewed by ELBOLD.`
    : `${loc?.description ?? ""} Every vendor individually reviewed.`;

  const subCategories = cat ? null : [
    { label: "DJs", href: `/${location}/djs` },
    { label: "Photographers", href: `/${location}/photographers` },
    { label: "Caterers", href: `/${location}/caterers` },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} lightBg />

      {/* Hero */}
      <div style={{ background: "#0B1F4D" }} className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <MapPin size={14} style={{ color: "rgba(212,175,55,0.7)" }} />
            <span
              className="text-xs tracking-[0.3em] font-semibold uppercase"
              style={{ color: "rgba(212,175,55,0.7)" }}
            >
              {loc?.county ?? location}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            {pageTitle}
          </h1>
          <p
            className="text-base font-light leading-relaxed max-w-xl mx-auto mb-8"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {pageDesc}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={`/browse?city=${loc?.county ?? location}`} className="btn-luxury text-sm">
              Browse All Vendors <ArrowRight size={13} />
            </Link>
            <Link href="/founding-vendors" className="btn-luxury-outline text-sm">
              List Your Services
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-categories (location landing only) */}
      {subCategories && (
        <div className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400 font-light">Browse by type:</span>
            {subCategories.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trust bar */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-6 justify-center">
          {["Manually reviewed vendors", "Stripe-secured payments", "Real verified reviews", "Free to get quotes"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500 font-light">
              <CheckCircle2 size={11} className="text-green-600" /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Vendor grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {allVendors.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {allVendors.length} Verified{cat ? ` ${cat.label}` : " Vendors"} in {loc?.title}
                </h2>
                <p className="text-sm text-gray-400 font-light mt-1">
                  Individually reviewed before listing on ELBOLD
                </p>
              </div>
              <Link href="/browse" className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors font-light">
                All vendors <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allVendors.map((v) => {
                const vCat = VENDOR_CATEGORIES[v.category as keyof typeof VENDOR_CATEGORIES];
                const cover = v.media?.find((m) => m.is_cover && m.type === "image") ?? v.media?.find((m) => m.type === "image");
                const verLevel = v.verification_level ?? 0;

                return (
                  <Link
                    key={v.id}
                    href={`/vendors/${v.id}`}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {cover ? (
                        <Image
                          src={cover.url}
                          alt={v.business_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0B1F4D, #162447)" }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {verLevel >= 2 && (
                          <span className="badge bg-white/15 border border-white/20 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                            <Shield size={9} />
                            {verLevel >= 4 ? "Premium Partner" : verLevel >= 3 ? "Trusted Pro" : "ID Verified"}
                          </span>
                        )}
                        {verLevel < 2 && v.verified && (
                          <span className="badge bg-white/15 border border-white/20 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                            <CheckCircle2 size={9} /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{v.business_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-light">{vCat?.label ?? v.category}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400 font-light flex items-center gap-1">
                          <MapPin size={10} /> {v.city}
                        </span>
                        {(v.rating ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-gray-700">{(v.rating ?? 0).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "#0B1F4D" }}
            >
              <MapPin size={24} style={{ color: "#D4AF37" }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Vendors Coming to {loc?.title} Soon
            </h3>
            <p className="text-gray-400 text-sm font-light mb-8 max-w-md mx-auto">
              We are actively onboarding verified professionals in {loc?.title}.
              Browse our full marketplace or join as a founding vendor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/browse" className="btn-luxury-dark text-sm">
                Browse All Vendors <ArrowRight size={14} />
              </Link>
              <Link href="/founding-vendors" className="btn-secondary-light text-sm">
                List Your Services
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Local areas */}
      {loc?.areas && (
        <div className="border-t border-gray-100 bg-gray-50 py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">
              Areas we serve in {loc.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {loc.areas.map((area) => (
                <Link
                  key={area}
                  href={`/browse?city=${area}`}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-white transition-colors font-light"
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
