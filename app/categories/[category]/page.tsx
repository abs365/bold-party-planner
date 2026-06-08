import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VENDOR_CATEGORIES } from "@/types";
import { Star, MapPin, ArrowRight, CheckCircle2, Shield, ShieldCheck, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = VENDOR_CATEGORIES[category as keyof typeof VENDOR_CATEGORIES];
  if (!cat) return { title: "Category Not Found" };

  const title = `${cat.label}s for Hire in the UK | ELBOLD Events`;
  const description = `Book verified ${cat.label.toLowerCase()}s for your event. Compare prices, view real portfolios, read reviews and book securely on ELBOLD Events, the UK's trusted event marketplace.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = VENDOR_CATEGORIES[category as keyof typeof VENDOR_CATEGORIES];
  if (!cat) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, business_name, city, rating, review_count, starting_price, description, verified, subscription_plan, verification_level")
    .eq("status", "approved")
    .eq("category", category)
    .order("subscription_plan", { ascending: false })
    .order("rating", { ascending: false })
    .limit(12);

  const vendorList = vendors ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.label}s for Hire in the UK`,
    description: `Find and book verified ${cat.label.toLowerCase()}s for events across the UK on ELBOLD Events.`,
    url: `https://elbold.com/categories/${category}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO: luxury navy, consistent with all public pages ──────── */}
      <div className="pt-16" style={{ background: "#0B1F4D" }}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-5 uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
            Verified Professionals
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            Find a <span style={{ color: "#D4AF37" }}>{cat.label}</span> for Your Event
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto mb-10" style={{ color: "rgba(255,255,255,0.42)" }}>
            Browse{vendorList.length > 0 ? ` ${vendorList.length}+` : " verified"} {cat.label.toLowerCase()}s across the UK.
            Every professional individually reviewed before joining the platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/browse?category=${category}`} className="btn-luxury text-sm px-8 py-3.5">
              Browse All {cat.label}s <ArrowRight size={14} />
            </Link>
            <Link href="/dashboard/create-event" className="btn-luxury-outline text-sm px-8 py-3.5">
              Get Smart Recommendations
            </Link>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ─────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100" style={{ background: "#fafaf9" }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 text-xs text-gray-500 font-light">
          {["Manually reviewed vendors", "Stripe-secured payments", "Real portfolio photos", "Verified reviews only", "Free to browse"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 size={11} style={{ color: "#0B1F4D" }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── VENDOR GRID ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        {vendorList.length === 0 ? (
          <div className="rounded-2xl p-20 text-center border border-gray-100">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: "rgba(11,31,77,0.06)" }}
            >
              <Shield size={26} style={{ color: "#0B1F4D" }} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {cat.label}s coming soon
            </h2>
            <p className="text-gray-400 text-sm font-light max-w-sm mx-auto mb-8">
              We are actively onboarding verified {cat.label.toLowerCase()}s. Browse our full marketplace or apply as a vendor.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/browse" className="btn-luxury-dark text-sm">
                Browse All Categories <ArrowRight size={13} />
              </Link>
              <Link href="/founding-vendors" className="btn-secondary-light text-sm">
                Join As a Vendor
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {vendorList.length} Verified {cat.label}{vendorList.length !== 1 ? "s" : ""}
                </h2>
                <p className="text-sm text-gray-400 font-light mt-0.5">
                  Individually reviewed before appearing on the platform
                </p>
              </div>
              <Link
                href={`/browse?category=${category}`}
                className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors font-light"
              >
                Advanced search <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendorList.map((v) => (
                <Link
                  key={v.id}
                  href={`/vendors/${v.id}`}
                  className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg hover:border-gray-200 transition-all group relative"
                >
                  {v.subscription_plan === "featured" && (
                    <div className="absolute top-3 right-3">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded"
                        style={{ background: "#D4AF37", color: "#0B1F4D" }}
                      >
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    {/* Initials avatar: no emoji */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{ background: "rgba(11,31,77,0.07)", color: "#0B1F4D" }}
                    >
                      {v.business_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{v.business_name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-gray-400">
                        <MapPin size={11} />
                        <span className="text-xs font-light">{v.city}</span>
                      </div>
                    </div>
                  </div>

                  {v.description && (
                    <p className="text-xs text-gray-400 font-light line-clamp-2 mb-3 leading-relaxed">{v.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 flex-wrap">
                      {v.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-gray-700">{v.rating.toFixed(1)}</span>
                          {v.review_count > 0 && <span className="text-xs text-gray-400 font-light">({v.review_count})</span>}
                        </div>
                      )}
                      {(v.verification_level ?? 0) >= 4 ? (
                        <div className="flex items-center gap-1" style={{ color: "#0B1F4D" }}>
                          <ShieldCheck size={11} />
                          <span className="text-xs font-medium">Business Verified</span>
                        </div>
                      ) : (v.verification_level ?? 0) >= 3 ? (
                        <div className="flex items-center gap-1" style={{ color: "#0B1F4D" }}>
                          <ShieldCheck size={11} />
                          <span className="text-xs font-medium">Trusted Pro</span>
                        </div>
                      ) : (v.verification_level ?? 0) >= 2 ? (
                        <div className="flex items-center gap-1" style={{ color: "#0B1F4D" }}>
                          <BadgeCheck size={11} />
                          <span className="text-xs font-medium">ID Verified</span>
                        </div>
                      ) : null}
                    </div>
                    {v.starting_price > 0 && (
                      <span className="text-sm font-semibold text-gray-900">From £{v.starting_price.toLocaleString()}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href={`/browse?category=${category}`} className="btn-luxury-dark text-sm">
                View All {cat.label}s with Filters <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── WHY ELBOLD ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-gray-100" style={{ background: "#fafaf9" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-light text-gray-900 text-center mb-8 tracking-tight">
            Why Book a {cat.label} on ELBOLD?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Individually reviewed", desc: `Every ${cat.label.toLowerCase()} is manually vetted by our team before appearing on the platform.` },
              { title: "Real portfolios and reviews", desc: "View genuine photos, videos, and reviews from real customers who booked through ELBOLD." },
              { title: "Stripe-secured payments", desc: "Pay your 30% deposit safely via Stripe. Your money is protected until your event completes." },
              { title: "Free to browse", desc: `No account needed to browse ${cat.label.toLowerCase()}s and compare packages. Only sign up when ready to book.` },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: "#0B1F4D", flexShrink: 0 }} />
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
