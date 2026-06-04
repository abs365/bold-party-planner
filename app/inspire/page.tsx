import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShowcaseGrid } from "@/components/ui/ShowcaseGrid";
import type { ShowcaseItem } from "@/components/ui/ShowcaseGrid";
import { ArrowRight, BadgeCheck, Camera, Video } from "lucide-react";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Showcase | Real Event Work from Verified UK Vendors",
  description:
    "Browse real photos and videos from verified UK event professionals. Photographers, decorators, DJs, caterers and more.",
};

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  // Fetch real vendor media — inner join ensures only approved vendors
  const { data: rawMedia } = await supabase
    .from("vendor_media")
    .select(`
      id, url, type, caption,
      vendor:vendors!inner(id, business_name, category, city, rating, review_count, verification_level)
    `)
    .eq("vendors.status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  type VendorRow = {
    id: string;
    business_name: string;
    category: string;
    city: string;
    rating: number;
    review_count: number;
    verification_level: number;
  };

  const items: ShowcaseItem[] = (rawMedia ?? [])
    .map((m) => {
      const vendorRaw = m.vendor as VendorRow | VendorRow[] | null;
      const vendor = Array.isArray(vendorRaw) ? vendorRaw[0] : vendorRaw;
      if (!vendor) return null;
      return {
        id: m.id,
        url: m.url,
        type: (m.type === "video" ? "video" : "image") as "image" | "video",
        caption: m.caption ?? null,
        vendor: {
          id: vendor.id,
          business_name: vendor.business_name,
          category: vendor.category,
          city: vendor.city,
          rating: vendor.rating ?? 0,
          review_count: vendor.review_count ?? 0,
          verification_level: vendor.verification_level ?? 0,
        },
      };
    })
    .filter((item): item is ShowcaseItem => item !== null);

  const imageCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.filter((i) => i.type === "video").length;
  const vendorCount = new Set(items.map((i) => i.vendor.id)).size;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} lightBg />

      {/* Hero — clean white, no gradients */}
      <section className="pt-24 pb-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-5 uppercase"
            style={{ color: "#D4AF37" }}
          >
            ELBOLD Showcase
          </p>
          <h1
            className="font-light tracking-tight mb-5"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              color: "#0B1F4D",
              lineHeight: 1.15,
            }}
          >
            Real work from real
            <br />
            <span style={{ color: "#D4AF37" }}>UK event professionals.</span>
          </h1>
          <p className="text-gray-500 font-light max-w-xl mx-auto mb-8 leading-relaxed">
            Every photo and video you see here was uploaded by a verified vendor on ELBOLD.
            Browse, get inspired, and book directly.
          </p>

          {/* Stats row */}
          {items.length > 0 && (
            <div className="flex items-center justify-center gap-8 mb-10">
              {[
                { icon: Camera, value: imageCount, label: "photos" },
                { icon: Video,  value: videoCount, label: "videos" },
                { icon: BadgeCheck, value: vendorCount, label: "vendors" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-xl font-semibold text-gray-900">{value}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-light">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/create-event" className="btn-luxury-dark">
              Plan an Event
              <ArrowRight size={14} />
            </Link>
            <Link href="/vendor/apply" className="btn-secondary-light">
              Showcase Your Work
            </Link>
          </div>
        </div>
      </section>

      {/* Main showcase grid — real vendor media with category filters */}
      {items.length > 0 ? (
        <ShowcaseGrid items={items} />
      ) : (
        /* Empty state when no vendors have uploaded yet */
        <section className="py-32 px-4 bg-white text-center">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "#f0f4ff", border: "1px solid #dce8f8" }}
          >
            <Camera size={28} style={{ color: "#0B1F4D" }} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            First vendor photos coming soon
          </h2>
          <p className="text-gray-400 font-light max-w-sm mx-auto mb-8">
            Verified vendors are uploading their portfolios. Check back shortly or browse vendor profiles now.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/browse" className="btn-luxury-dark">
              Browse Vendors <ArrowRight size={14} />
            </Link>
            <Link href="/vendor/apply" className="btn-secondary-light">
              Join as a Vendor
            </Link>
          </div>
        </section>
      )}

      {/* Vendor CTA section */}
      <section className="py-20 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* For customers */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#0B1F4D" }}
            >
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-4 uppercase"
                style={{ color: "rgba(212,175,55,0.7)" }}
              >
                For Customers
              </p>
              <h3
                className="text-2xl font-light mb-3 tracking-tight"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                Ready to start planning?
              </h3>
              <p className="font-light text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                Use our Smart Planner to build a complete event plan with
                recommended vendors, budget breakdown and timeline.
              </p>
              <Link href="/dashboard/create-event" className="btn-luxury text-sm py-3 px-6">
                Start Planning for Free
              </Link>
            </div>

            {/* For vendors */}
            <div
              className="rounded-2xl p-8 border"
              style={{ background: "#fafaf9", borderColor: "#e5e5e4" }}
            >
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-4 uppercase"
                style={{ color: "rgba(11,31,77,0.4)" }}
              >
                For Vendors
              </p>
              <h3 className="text-2xl font-light text-gray-900 mb-3 tracking-tight">
                Showcase your work here.
              </h3>
              <p className="font-light text-sm text-gray-500 leading-relaxed mb-6">
                Apply for a free vendor profile. Upload your portfolio photos and videos.
                Get discovered by customers already searching for your category.
              </p>
              <Link href="/vendor/apply" className="btn-luxury-dark text-sm py-3 px-6">
                Apply as a Vendor
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
