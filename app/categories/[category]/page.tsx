import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VENDOR_CATEGORIES } from "@/types";
import { Star, MapPin, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = VENDOR_CATEGORIES[category as keyof typeof VENDOR_CATEGORIES];
  if (!cat) return { title: "Category Not Found" };

  const title = `${cat.label}s for Hire in the UK | Bold Party`;
  const description = `Book verified ${cat.label.toLowerCase()}s for your event. Compare prices, view real portfolios, read reviews, and book securely on Bold Party — the UK's trusted event marketplace.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
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
    .select("id, business_name, city, rating, review_count, starting_price, description, verified, subscription_plan")
    .eq("status", "approved")
    .eq("category", category)
    .order("subscription_plan", { ascending: false })
    .order("rating", { ascending: false })
    .limit(12);

  const vendorList = vendors ?? [];

  // JSON-LD for category page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${cat.label}s for Hire in the UK`,
    "description": `Find and book verified ${cat.label.toLowerCase()}s for events across the UK on Bold Party.`,
    "url": `https://boldparty.co.uk/categories/${category}`,
  };

  return (
    <div className="min-h-screen">
      <Navbar user={profile} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-5xl mb-4">{cat.icon}</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Hire a <span className="gradient-brand-text">{cat.label}</span> for Your Event
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Browse {vendorList.length > 0 ? `${vendorList.length}+` : "verified"} {cat.label.toLowerCase()}s across the UK. Real portfolios, honest reviews, secure booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/browse?category=${category}`} className="btn-primary">
              <Sparkles size={16} />
              Browse All {cat.label}s
              <ArrowRight size={15} />
            </Link>
            <Link href="/dashboard/create-event" className="btn-secondary">
              Get Smart Recommendations
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-y border-white/8 bg-white/2 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          {["Verified vendors only", "Secure Stripe payments", "Real portfolio photos", "Genuine customer reviews", "Free to browse"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-brand-400" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Grid */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        {vendorList.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-5xl mb-4">{cat.icon}</div>
            <h2 className="text-xl font-bold text-white mb-2">No {cat.label}s listed yet</h2>
            <p className="text-slate-400 text-sm mb-6">We&apos;re growing fast. Check back soon or browse all vendor categories.</p>
            <Link href="/browse" className="btn-primary">Browse All Categories</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">
                {vendorList.length} {cat.label}{vendorList.length !== 1 ? "s" : ""} Available
              </h2>
              <Link href={`/browse?category=${category}`} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Advanced search <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorList.map((v) => (
                <Link
                  key={v.id}
                  href={`/vendors/${v.id}`}
                  className="glass-card p-6 card-hover group relative"
                >
                  {v.subscription_plan === "featured" && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs gradient-brand text-white px-2 py-0.5 rounded-full font-medium">Featured</span>
                    </div>
                  )}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm truncate group-hover:text-brand-400 transition-colors">
                        {v.business_name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-slate-500">
                        <MapPin size={11} />
                        <span className="text-xs">{v.city}</span>
                      </div>
                    </div>
                  </div>

                  {v.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{v.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {v.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs text-white font-medium">{v.rating.toFixed(1)}</span>
                          {v.review_count > 0 && <span className="text-xs text-slate-500">({v.review_count})</span>}
                        </div>
                      )}
                      {v.verified && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 size={11} />
                          <span className="text-xs">Verified</span>
                        </div>
                      )}
                    </div>
                    {v.starting_price > 0 && (
                      <span className="text-sm font-bold text-white">From £{v.starting_price.toLocaleString()}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href={`/browse?category=${category}`} className="btn-secondary">
                View All {cat.label}s with Filters
                <ArrowRight size={15} />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* FAQ / Why Bold Party */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-brand-950/10 to-transparent">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Why Book a {cat.label} on Bold Party?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Verified professionals", desc: `Every ${cat.label.toLowerCase()} is manually vetted before appearing on the platform.` },
              { title: "Real portfolios & reviews", desc: "View genuine photos, videos, and reviews from real customers." },
              { title: "Secure payments", desc: "Pay your deposit safely via Stripe. Your money is fully protected." },
              { title: "Free to browse", desc: `No account needed to browse ${cat.label.toLowerCase()}s. Only sign up when ready to book.` },
            ].map((item) => (
              <div key={item.title} className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-brand-400" />
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
