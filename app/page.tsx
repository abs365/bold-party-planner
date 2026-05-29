import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Star, CheckCircle2, Shield, Lock, Clock, Award, MapPin } from "lucide-react";
import { VENDOR_CATEGORIES } from "@/types";
import type { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "ELBOLD Events | Trusted Vendors for Extraordinary Celebrations",
  description: "The UK's trusted event vendor marketplace. Book verified DJs, photographers, caterers, decorators and more for weddings, birthdays, and corporate events. Start free.",
  openGraph: {
    title: "ELBOLD Events | Trusted Vendors for Extraordinary Celebrations",
    description: "Book verified UK event vendors. Secure payments, guaranteed experience.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const TRUST_ITEMS = [
  { icon: Lock, label: "Stripe-secured payments" },
  { icon: Award, label: "Manually verified vendors" },
  { icon: Shield, label: "Full dispute protection" },
  { icon: Clock, label: "24/7 support team" },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  dj: "from-purple-700 to-violet-800",
  photographer: "from-blue-700 to-cyan-800",
  caterer: "from-amber-700 to-orange-800",
  mc: "from-emerald-700 to-teal-800",
  decorator: "from-rose-700 to-pink-800",
  transport: "from-indigo-700 to-blue-800",
  cake_maker: "from-pink-700 to-rose-800",
  live_band: "from-violet-700 to-purple-800",
  venue: "from-slate-700 to-zinc-800",
  florist: "from-green-700 to-emerald-800",
  hair_makeup: "from-fuchsia-700 to-pink-800",
  entertainment: "from-orange-700 to-red-800",
};

type FeaturedVendor = Pick<
  Vendor,
  "id" | "business_name" | "category" | "city" | "rating" | "review_count" |
  "starting_price" | "subscription_plan" | "verified" | "min_price"
> & {
  media?: Array<{ url: string; type: string; is_cover: boolean }>;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const featuredRes = await supabase
    .from("vendors")
    .select("id, business_name, category, city, rating, review_count, starting_price, subscription_plan, verified, min_price, media:vendor_media(url, type, is_cover)")
    .eq("status", "approved")
    .in("subscription_plan", ["featured", "pro"])
    .order("subscription_plan", { ascending: false })
    .order("rating", { ascending: false })
    .limit(6);

  const vendors = (featuredRes.data ?? []) as FeaturedVendor[];

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} lightBg />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-16">
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 text-sm mb-8">
            UK event marketplace
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-gray-900">
            Plan your event.
            <br />
            <span className="gradient-brand-text">Book trusted vendors.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Find verified DJs, photographers, caterers, decorators and 15+ more categories. Smart planning tools included.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link href="/browse" className="btn-primary text-base py-3.5 px-8">
              Browse Vendors
              <ArrowRight size={16} />
            </Link>
            <Link href="/vendor/apply" className="btn-secondary-light text-base py-3.5 px-8">
              Join as a Vendor
            </Link>
          </div>

          <p className="text-sm text-gray-400">
            Trusted by event hosts across London, Manchester, Birmingham &amp; beyond
          </p>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-gray-500 text-sm">
              <Icon size={14} className="text-gray-400" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK USER PATHS ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col shadow-sm">
              <div className="text-3xl mb-5">🎉</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Planning an event?</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                Browse verified vendors across 19 categories. Use the Smart Planner to build a complete plan with budget, timeline, and vendor shortlist.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/browse" className="btn-primary text-sm py-2.5 px-5">
                  Browse Vendors <ArrowRight size={14} />
                </Link>
                <Link href="/dashboard/create-event" className="btn-secondary-light text-sm py-2.5 px-5">
                  Use Smart Planner
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col shadow-sm">
              <div className="text-3xl mb-5">💼</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Are you a vendor?</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                Join event professionals growing their bookings through ELBOLD Events. Free to join and keep 90% of every booking.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/vendor/apply" className="btn-primary text-sm py-2.5 px-5">
                  Apply as a Vendor <ArrowRight size={14} />
                </Link>
                <Link href="/how-it-works" className="btn-secondary-light text-sm py-2.5 px-5">
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED VENDORS ──────────────────────────────────────────────── */}
      {vendors.length > 0 && (
        <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Featured Vendors</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Hand-picked professionals with outstanding reviews.
                </p>
              </div>
              <Link
                href="/browse"
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((v) => {
                const cat = VENDOR_CATEGORIES[v.category as keyof typeof VENDOR_CATEGORIES];
                const coverMedia =
                  v.media?.find((m) => m.is_cover && m.type === "image") ??
                  v.media?.find((m) => m.type === "image");
                const gradient = CATEGORY_GRADIENTS[v.category] ?? "from-brand-700 to-violet-800";
                return (
                  <Link
                    key={v.id}
                    href={`/vendors/${v.id}`}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {coverMedia ? (
                        <Image
                          src={coverMedia.url}
                          alt={v.business_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <span className="text-5xl opacity-30">{cat?.icon ?? "🎉"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {v.subscription_plan === "featured" && (
                          <span className="badge bg-amber-500/90 text-amber-900 text-xs font-bold">Featured</span>
                        )}
                        {v.verified && (
                          <span className="badge bg-black/40 border border-white/20 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        )}
                      </div>
                      {(v.starting_price ?? 0) > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/55 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                          <span className="text-xs text-white/70">From </span>
                          <span className="text-sm font-semibold text-white">
                            £{(v.starting_price ?? 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{v.business_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{cat?.label ?? v.category}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={10} /> {v.city}
                        </div>
                        {v.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-gray-700">{v.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link href="/browse" className="btn-secondary-light text-sm">
                View All Vendors <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT ARE YOU PLANNING ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900">What are you planning?</h2>
            <p className="text-gray-500 text-sm mt-1">
              Get inspired and browse vendors for your occasion.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Wedding",
                desc: "Floral arches, live music, catering, photography and full coordination.",
                emoji: "💍",
                href: "/browse?event=wedding",
                budget: "Budgets from £3,000",
              },
              {
                title: "Birthday Party",
                desc: "DJ, decorator, photobooth and celebration cake for any age and scale.",
                emoji: "🎂",
                href: "/browse?event=birthday",
                budget: "Budgets from £500",
              },
              {
                title: "Corporate Event",
                desc: "AV and lighting, catering, MC, logistics handled end to end.",
                emoji: "🏢",
                href: "/browse?event=corporate",
                budget: "Budgets from £1,500",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="bg-gray-50 border border-gray-100 rounded-xl p-6 group hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                <p className="text-xs text-gray-400 mb-4">{item.budget}</p>
                <div className="flex items-center gap-1 text-gray-400 group-hover:text-gray-900 text-xs font-medium transition-colors">
                  Browse vendors <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/inspire" className="btn-secondary-light text-sm">
              Browse All Inspiration <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="flex justify-center gap-1 mb-5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              &ldquo;ELBOLD Events made planning my 30th birthday effortless. It suggested exactly what I needed, the DJ and decorator were incredible, and everything ran perfectly.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white shrink-0">
                AJ
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Amara Johnson</div>
                <div className="text-xs text-gray-400">30th Birthday · London</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
