import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Star, MapPin, Shield, CheckCircle2 } from "lucide-react";
import { VENDOR_CATEGORIES } from "@/types";
import type { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "Vendor Spotlights | Real Professionals on ELBOLD Events",
  description:
    "Meet the verified event professionals behind ELBOLD. Photographers, DJs, decorators, caterers and more — each individually reviewed, each committed to extraordinary events.",
  openGraph: {
    title: "Vendor Spotlights | ELBOLD Events",
    description: "The verified professionals who make extraordinary events happen.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

type SpotlightVendor = Pick<
  Vendor,
  "id" | "business_name" | "category" | "city" | "description" |
  "rating" | "review_count" | "verified" | "verification_level" | "subscription_plan"
> & { media?: Array<{ url: string; type: string; is_cover: boolean }> };

const CATEGORY_FEATURE_PHRASES: Record<string, string> = {
  photographer: "captures the moments that matter",
  dj: "sets the atmosphere for the whole event",
  decorator: "transforms spaces into memorable environments",
  caterer: "feeds celebrations with care and creativity",
  venue_hire: "provides the setting for extraordinary occasions",
  entertainer: "creates moments guests talk about for years",
  cake_designer: "crafts centrepieces that mark the occasion",
  event_planner: "orchestrates every detail from start to finish",
};

export default async function VendorSpotlightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  // Fetch featured and pro vendors with media for spotlights
  const { data: featuredVendors } = await supabase
    .from("vendors")
    .select("id, business_name, category, city, description, rating, review_count, verified, verification_level, subscription_plan, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .in("subscription_plan", ["featured", "pro"])
    .gte("verification_level", 2)
    .order("rating", { ascending: false })
    .limit(6);

  // Fallback: any approved vendors with media
  const { data: allVendors } = await supabase
    .from("vendors")
    .select("id, business_name, category, city, description, rating, review_count, verified, verification_level, subscription_plan, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .order("rating", { ascending: false })
    .limit(9);

  const spotlightVendors = (
    (featuredVendors?.length ?? 0) >= 3 ? featuredVendors : allVendors
  ) as SpotlightVendor[];

  const hasVendors = (spotlightVendors?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="pt-16" style={{ background: "#0B1F4D" }}>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
            Vendor Spotlights
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            The professionals behind
            <br />
            extraordinary events.
          </h1>
          <p className="text-base font-light max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every vendor on ELBOLD is individually reviewed before joining the platform.
            These are some of the professionals who have met our standards — and who have gone further.
          </p>
        </div>
      </div>

      {/* ── VENDOR SPOTLIGHTS ────────────────────────────────────────── */}
      {hasVendors ? (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-20">
              {spotlightVendors.map((vendor, i) => {
                const cat = VENDOR_CATEGORIES[vendor.category as keyof typeof VENDOR_CATEGORIES];
                const coverMedia =
                  vendor.media?.find((m) => m.is_cover && m.type === "image") ??
                  vendor.media?.find((m) => m.type === "image");
                const featurePhrase = CATEGORY_FEATURE_PHRASES[vendor.category] ?? "delivers an exceptional service";
                const verLevel = vendor.verification_level ?? 0;
                const isEven = i % 2 === 0;

                return (
                  <div
                    key={vendor.id}
                    className={`grid md:grid-cols-2 gap-12 items-center ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}
                  >
                    {/* Photo */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
                      {coverMedia ? (
                        <Image
                          src={coverMedia.url}
                          alt={vendor.business_name}
                          fill
                          quality={80}
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-sm font-semibold tracking-widest"
                          style={{ background: "linear-gradient(160deg, #0B1F4D, #162447)", color: "rgba(212,175,55,0.3)" }}
                        >
                          ELBOLD
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      {verLevel >= 2 && (
                        <div className="absolute bottom-4 left-4">
                          <span
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm"
                            style={{ background: "rgba(11,31,77,0.75)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}
                          >
                            <Shield size={10} />
                            {verLevel >= 4 ? "Business Verified" : verLevel >= 3 ? "Trusted Professional" : "ID Verified"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Story */}
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <span className="text-xs tracking-[0.3em] font-semibold uppercase" style={{ color: "#C9A84C" }}>
                          {cat?.label ?? vendor.category}
                        </span>
                        <div className="h-px flex-1" style={{ background: "rgba(201,168,76,0.15)" }} />
                      </div>

                      <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-1">
                        {vendor.business_name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-sm text-gray-400 font-light mb-5">
                        <MapPin size={12} />
                        {vendor.city}
                      </div>

                      {/* Feature phrase */}
                      <p className="text-base font-light text-gray-600 leading-relaxed mb-5 italic" style={{ borderLeft: "2px solid #D4AF37", paddingLeft: "1rem" }}>
                        &ldquo;A professional who {featurePhrase}.&rdquo;
                      </p>

                      {vendor.description && (
                        <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">
                          {vendor.description.slice(0, 220)}{vendor.description.length > 220 ? "..." : ""}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex gap-5 mb-7">
                        {(vendor.rating ?? 0) > 0 && (
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span className="text-lg font-light text-gray-900">{(vendor.rating ?? 0).toFixed(1)}</span>
                            </div>
                            <div className="text-xs text-gray-400 font-light">
                              {(vendor.review_count ?? 0) > 0 ? `${vendor.review_count} reviews` : "rating"}
                            </div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-lg font-light text-gray-900 flex items-center gap-1">
                            <CheckCircle2 size={12} style={{ color: "#0B1F4D" }} />
                            ELBOLD
                          </div>
                          <div className="text-xs text-gray-400 font-light">Verified</div>
                        </div>
                      </div>

                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                        style={{ color: "#0B1F4D" }}
                      >
                        View full profile <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* Building phase — coming soon */
        <section className="py-32 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
                Coming Soon
              </p>
              <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-4">
                Spotlights are building.
              </h2>
              <p className="text-sm text-gray-500 font-light leading-relaxed max-w-lg mx-auto">
                ELBOLD is actively onboarding and verifying event professionals across the United Kingdom.
                As our verified vendor community grows, we will feature profiles here from professionals
                who represent the standard we stand for.
              </p>
            </div>

            {/* Preview cards — editorial placeholders */}
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { category: "Photographers", city: "London", label: "PH" },
                { category: "DJs", city: "Essex", label: "DJ" },
                { category: "Decorators", city: "Kent", label: "DE" },
              ].map(({ category, city, label }) => (
                <div
                  key={category}
                  className="rounded-2xl overflow-hidden border border-gray-100"
                >
                  <div
                    className="h-48 flex items-center justify-center text-lg font-semibold tracking-widest"
                    style={{ background: "linear-gradient(160deg, #0B1F4D, #162447)", color: "rgba(212,175,55,0.25)" }}
                  >
                    {label}
                  </div>
                  <div className="p-5">
                    <div className="text-xs tracking-wider font-semibold mb-1" style={{ color: "#C9A84C" }}>{category}</div>
                    <div className="text-sm text-gray-400 font-light">{city}</div>
                    <div
                      className="mt-3 text-xs font-light"
                      style={{ color: "rgba(11,31,77,0.25)" }}
                    >
                      Profile coming soon
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT IT MEANS TO BE FEATURED ─────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
                The Standard
              </p>
              <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-5">
                Not every vendor gets a spotlight.
                <br />
                Every vendor gets a review.
              </h2>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
                Vendor Spotlights feature professionals who have been verified, have built a track record
                of excellent reviews, and whose work demonstrates the quality standard ELBOLD was built to represent.
                But every vendor on the platform — not just those featured here — has been individually reviewed
                by our team before listing.
              </p>
              <Link
                href="/how-we-verify"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: "#0B1F4D" }}
              >
                How we verify vendors <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { title: "Individually reviewed before listing", desc: "Every application is assessed by a member of our team against published standards." },
                { title: "Portfolio verified as genuine work", desc: "We check that portfolio images represent the vendor's actual, current capability." },
                { title: "Identity confirmed", desc: "The person listing the service is confirmed to be the actual service provider." },
                { title: "Ongoing accountability", desc: "Vendors who fall below standard after approval face a progressive warning system — up to and including removal." },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3 bg-white rounded-xl p-5 border border-gray-100">
                  <CheckCircle2 size={14} style={{ color: "#0B1F4D", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-0.5">{title}</div>
                    <div className="text-xs text-gray-400 font-light leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ARE YOU A VENDOR? ─────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0B1F4D" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>
            For Event Professionals
          </p>
          <h2 className="text-2xl font-light tracking-tight mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>
            Join the professionals featured here.
          </h2>
          <p className="text-sm font-light leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.38)" }}>
            Apply for a free vendor profile. Pass our review process. Build your reputation through
            real bookings and verified reviews. Vendor Spotlights are reserved for ELBOLD professionals
            who meet the standard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/founding-vendors" className="btn-luxury text-sm px-10">
              Apply Free <ArrowRight size={14} />
            </Link>
            <Link href="/vendor-standards" className="btn-luxury-outline text-sm px-10">
              Read Our Standards
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
