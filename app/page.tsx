import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Star, CheckCircle2, MapPin } from "lucide-react";
import { VENDOR_CATEGORIES } from "@/types";
import type { Vendor } from "@/types";

export const metadata: Metadata = {
  title: "ELBOLD Events | Trusted Vendors for Extraordinary Celebrations",
  description: "The UK's premium event vendor marketplace. Book verified DJs, photographers, caterers, decorators and more for weddings, birthdays, and corporate events.",
  openGraph: {
    title: "ELBOLD Events | Trusted Vendors for Extraordinary Celebrations",
    description: "Trusted vendors for extraordinary celebrations across the United Kingdom.",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ELBOLD Events – Find Premium Event Vendors Across the UK",
        type: "image/png",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

type FeaturedVendor = Pick<
  Vendor,
  "id" | "business_name" | "category" | "city" | "rating" | "review_count" |
  "starting_price" | "subscription_plan" | "verified" | "min_price"
> & {
  media?: Array<{ url: string; type: string; is_cover: boolean }>;
};

function ElboldMark({ size = 40, fetchPriority }: { size?: number; fetchPriority?: "high" | "low" | "auto" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/elbold-mark.svg"
      width={size}
      height={size}
      alt="ELBOLD"
      fetchPriority={fetchPriority}
      style={{ display: "block" }}
    />
  );
}

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
    <div className="min-h-screen">
      {/* Dark navbar sits over the dark navy hero */}
      <Navbar user={profile} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0D1B3E" }}
      >
        {/* Subtle radial gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 90% 55% at 50% 25%, rgba(201,168,76,0.055) 0%, transparent 65%)",
          }}
        />

        {/* Very subtle lower-left dark vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 0% 100%, rgba(6,10,20,0.4) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-32">

          {/* Brand mark — acts as a centrepiece, not just a nav logo */}
          <div className="flex flex-col items-center mb-14">
            <ElboldMark size={72} fetchPriority="high" />
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-10" style={{ background: "rgba(201,168,76,0.35)" }} />
              <span
                className="text-xs tracking-[0.35em] font-semibold"
                style={{ color: "rgba(201,168,76,0.7)" }}
              >
                ELBOLD EVENTS
              </span>
              <div className="h-px w-10" style={{ background: "rgba(201,168,76,0.35)" }} />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.06] text-white mb-8"
          >
            Extraordinary
            <br />
            Celebrations{" "}
            <span style={{ color: "#C9A84C" }}>Start Here.</span>
          </h1>

          {/* Subline */}
          <p
            className="text-lg font-light leading-relaxed max-w-xl mx-auto mb-12"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Find trusted vendors for weddings, birthdays, corporate events
            and unforgettable moments across the United Kingdom.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/browse" className="btn-luxury">
              Find Vendors
              <ArrowRight size={15} />
            </Link>
            <Link href="/founding-vendors" className="btn-luxury-outline">
              List Your Services Free
            </Link>
          </div>

          {/* Trust micro-line */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-light tracking-wide"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {["Verified Vendors", "Stripe Secured", "Dispute Protected", "Free to Join"].map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: "rgba(201,168,76,0.3)" }}>·</span>}
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-widest font-light animate-bounce"
          style={{ color: "rgba(201,168,76,0.35)" }}
          aria-hidden="true"
        >
          ↓
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────────────────────── */}
      <section style={{ background: "#091529", borderTop: "1px solid rgba(201,168,76,0.12)" }}>
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            { icon: "✦", label: "Manually verified vendors" },
            { icon: "✦", label: "Stripe-secured payments" },
            { icon: "✦", label: "Full dispute protection" },
            { icon: "✦", label: "Free to list your services" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>{icon}</span>
              <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.45)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── USER PATHS ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Planner path */}
            <div className="border border-gray-100 rounded-2xl p-10 flex flex-col bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="mb-7">
                <ElboldMark size={40} />
              </div>
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
                style={{ color: "#C9A84C" }}
              >
                For Hosts
              </p>
              <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">
                Planning an event?
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1 font-light">
                Browse verified DJs, photographers, caterers, decorators and
                19 more categories. Every vendor is individually reviewed before
                joining the platform.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/browse" className="btn-luxury-dark text-sm py-3">
                  Browse Vendors <ArrowRight size={14} />
                </Link>
                <Link href="/dashboard/create-event" className="btn-secondary-light text-sm py-3">
                  Plan with Smart Planner
                </Link>
              </div>
            </div>

            {/* Vendor path */}
            <div
              className="rounded-2xl p-10 flex flex-col hover:shadow-lg transition-all duration-300"
              style={{ background: "#0D1B3E" }}
            >
              <div className="mb-7">
                <ElboldMark size={40} />
              </div>
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
                style={{ color: "rgba(201,168,76,0.65)" }}
              >
                For Event Professionals
              </p>
              <h2
                className="text-2xl font-light mb-4 tracking-tight"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                Get found. Get booked.
              </h2>
              <p
                className="text-sm leading-relaxed mb-8 flex-1 font-light"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Event hosts in your area are searching for vendors right now.
                List your services free, set your own pricing, and keep 90% of
                every booking you receive. No monthly fees. Cancel anytime.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/founding-vendors" className="btn-luxury text-sm py-3">
                  Get Listed Free <ArrowRight size={14} />
                </Link>
                <Link
                  href="/founding-vendors"
                  className="btn-luxury-outline text-sm py-3"
                  style={{ fontSize: "0.8rem" }}
                >
                  See Founding Vendor Benefits
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURED VENDORS ─────────────────────────────────────────────── */}
      {vendors.length > 0 && (
        <section className="py-24 px-4" style={{ background: "#f8f7f5" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p
                  className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
                  style={{ color: "#C9A84C" }}
                >
                  Our Vendors
                </p>
                <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                  Trusted Professionals
                </h2>
              </div>
              <Link
                href="/browse"
                className="text-sm text-gray-400 hover:text-gray-900 flex items-center gap-1.5 transition-colors font-light"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendors.map((v) => {
                const cat = VENDOR_CATEGORIES[v.category as keyof typeof VENDOR_CATEGORIES];
                const coverMedia =
                  v.media?.find((m) => m.is_cover && m.type === "image") ??
                  v.media?.find((m) => m.type === "image");
                return (
                  <Link
                    key={v.id}
                    href={`/vendors/${v.id}`}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative h-52 overflow-hidden">
                      {coverMedia ? (
                        <Image
                          src={coverMedia.url}
                          alt={v.business_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "#0D1B3E" }}
                        >
                          <ElboldMark size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {v.subscription_plan === "featured" && (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded"
                            style={{ background: "#C9A84C", color: "#0D1B3E" }}
                          >
                            Featured
                          </span>
                        )}
                        {v.verified && (
                          <span className="badge bg-white/15 border border-white/20 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        )}
                      </div>
                      {(v.starting_price ?? 0) > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/55 px-2.5 py-1 rounded backdrop-blur-sm">
                          <span className="text-xs text-white/60">From </span>
                          <span className="text-sm font-semibold text-white">
                            £{(v.starting_price ?? 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{v.business_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize font-light">{cat?.label ?? v.category}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-light">
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

            <div className="text-center mt-10">
              <Link href="/browse" className="btn-luxury-dark text-sm">
                Browse All Vendors <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── OCCASIONS ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p
              className="text-xs tracking-[0.25em] font-semibold mb-3 uppercase"
              style={{ color: "#C9A84C" }}
            >
              Occasions
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              What are you celebrating?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Wedding",
                desc: "Floral design, photography, catering, live music and full coordination for the perfect day.",
                from: "Packages from £3,000",
                href: "/browse?event=wedding",
              },
              {
                title: "Birthday",
                desc: "DJ, decoration, cake and photo experiences for birthdays of any scale or style.",
                from: "Packages from £500",
                href: "/browse?event=birthday",
              },
              {
                title: "Corporate",
                desc: "AV, catering, MC and end-to-end logistics for conferences, launches and team events.",
                from: "Packages from £1,500",
                href: "/browse?event=corporate",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group border border-gray-100 rounded-xl p-7 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-white"
              >
                <p
                  className="text-xs tracking-[0.2em] font-semibold mb-4 uppercase"
                  style={{ color: "rgba(201,168,76,0.7)" }}
                >
                  {item.title}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 font-light">{item.desc}</p>
                <p className="text-xs text-gray-300 mb-5 font-light">{item.from}</p>
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold tracking-wide group-hover:gap-2.5 transition-all"
                  style={{ color: "#0D1B3E" }}
                >
                  Browse vendors <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST PILLARS ─────────────────────────────────────────────────── */}
      <section
        className="py-24 px-4"
        style={{ background: "#0D1B3E" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.3em] font-semibold mb-4 uppercase"
              style={{ color: "rgba(201,168,76,0.55)" }}
            >
              Why ELBOLD
            </p>
            <h2
              className="text-2xl font-light tracking-tight"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Built around vendor quality and customer confidence.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: "✦",
                title: "Every vendor is reviewed",
                desc: "We manually review every vendor application before they appear on the platform. No automated approvals.",
              },
              {
                icon: "✦",
                title: "Secure Stripe payments",
                desc: "All booking payments go through Stripe. Deposits are held securely and released upon completion.",
              },
              {
                icon: "✦",
                title: "Reviews from real bookings only",
                desc: "Customer reviews are collected only after a confirmed, completed booking. No unverified ratings.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.1)" }}
              >
                <div
                  className="text-sm mb-4"
                  style={{ color: "rgba(201,168,76,0.6)" }}
                >
                  {icon}
                </div>
                <h3
                  className="font-semibold text-sm mb-3"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center pt-10" style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}>
            <p
              className="text-xs tracking-[0.25em] font-light mb-6"
              style={{ color: "rgba(201,168,76,0.45)" }}
            >
              READY TO BEGIN?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse" className="btn-luxury">
                Find Vendors
              </Link>
              <Link href="/founding-vendors" className="btn-luxury-outline">
                Join as a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
