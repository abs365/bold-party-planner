import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { GUIDES } from "@/lib/guides";
import { ArrowRight, Clock, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Event Planning Guides | ELBOLD",
  description:
    "Free event planning guides for UK couples, families, and businesses. DJ costs, wedding checklists, how to choose a photographer, party planning — written by event professionals.",
};

export const dynamic = "force-dynamic";

const CATEGORIES = ["All", "Weddings", "Entertainment", "Photography", "Parties", "Corporate"];

export default async function GuidesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* Hero */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
            style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", color: "rgba(212,175,55,0.85)" }}
          >
            <BookOpen size={12} />
            Planning Guides
          </div>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Plan your event
            <br />
            <span style={{ color: "#D4AF37" }}>with confidence.</span>
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Free guides written for UK event organisers. Understand costs, avoid common mistakes,
            and know exactly what questions to ask before you book.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-20">

        {/* Article grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Card header */}
              <div
                className="px-6 py-8 flex-1"
                style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #162447 100%)" }}
              >
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
                >
                  {guide.heroTag}
                </div>
                <h2
                  className="text-lg font-light leading-snug group-hover:text-yellow-300 transition-colors"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  {guide.title}
                </h2>
              </div>

              {/* Card footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} />
                  {guide.readingMinutes} min read
                </div>
                <span
                  className="text-xs font-semibold inline-flex items-center gap-1"
                  style={{ color: "#C9A84C" }}
                >
                  Read guide
                  <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Trust note */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
        >
          <h2 className="text-xl font-light text-gray-900 mb-3">Ready to find your vendor?</h2>
          <p className="text-sm text-gray-500 font-light mb-6 max-w-md mx-auto">
            Every vendor on ELBOLD is individually reviewed before listing. Browse verified professionals across the UK.
          </p>
          <Link href="/browse" className="btn-luxury-dark text-sm py-3.5 px-8 inline-flex">
            Browse Verified Vendors
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  );
}
