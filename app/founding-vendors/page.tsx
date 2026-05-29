import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Star, TrendingUp, Shield, Zap, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Founding Vendor Programme",
  description: "Join as one of ELBOLD's first trusted vendors. Free profile, priority placement, and the exclusive Founding Vendor badge. Limited places available.",
};

const BENEFITS = [
  {
    icon: CheckCircle2,
    title: "Free Profile Forever",
    description: "Your vendor profile is completely free — no monthly fees, no setup costs. Keep 90% of every booking.",
  },
  {
    icon: Star,
    title: "Founding Vendor Badge",
    description: "Your profile displays an exclusive Founding Vendor badge, visible to every customer who views it.",
  },
  {
    icon: TrendingUp,
    title: "Priority Placement",
    description: "Founding Vendors appear higher in search results and category pages, giving you a lasting visibility advantage.",
  },
  {
    icon: Zap,
    title: "Early Access to Features",
    description: "You'll be first to access new tools, features, and marketplace improvements as ELBOLD grows.",
  },
  {
    icon: Shield,
    title: "Enhanced Visibility",
    description: "Highlighted on the homepage and featured in our launch marketing campaign to event hosts across the UK.",
  },
  {
    icon: Award,
    title: "Founding Vendor Status",
    description: "As the marketplace scales, Founding Vendors are recognised as the trusted foundation the platform was built on.",
  },
];

const STEPS = [
  { n: "1", label: "Apply in minutes", sub: "Complete your vendor profile — takes about 5 minutes" },
  { n: "2", label: "Our team reviews", sub: "We review and approve within 24–48 hours" },
  { n: "3", label: "Go live", sub: "Your profile appears on the marketplace immediately" },
  { n: "4", label: "Receive enquiries", sub: "Customers find and contact you directly" },
];

async function getProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data;
  } catch { return null; }
}

export default async function FoundingVendorsPage() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* Hero */}
      <section className="pt-16 pb-24 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-4xl mx-auto text-center pt-20">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-10 tracking-[0.2em] uppercase"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "rgba(201,168,76,0.8)" }}
          >
            <Award size={12} />
            Founding Vendor Programme
          </div>
          <h1
            className="text-4xl sm:text-5xl font-light tracking-tight mb-6 leading-tight"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Be part of something
            <br />
            <span style={{ color: "#C9A84C" }}>extraordinary.</span>
          </h1>
          <p
            className="text-lg font-light max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            ELBOLD Events is launching. We are selecting our first 20 trusted vendors —
            event professionals who will form the foundation of the UK&apos;s most trusted event marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vendor/apply" className="btn-luxury">
              Apply as a Founding Vendor
            </Link>
            <Link href="/browse" className="btn-luxury-outline">
              Browse the Marketplace
            </Link>
          </div>
          <p
            className="text-xs font-light mt-7"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Limited to the first 20 approved vendors. No credit card required.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What Founding Vendors receive</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to start receiving bookings from day one, with advantages that last.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-[#0d1b3e] flex items-center justify-center mb-5">
                  <Icon size={20} style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How to join</h2>
            <p className="text-gray-500">Simple, fast, and free.</p>
          </div>
          <div className="space-y-6">
            {STEPS.map(({ n, label, sub }) => (
              <div key={n} className="flex items-start gap-5 bg-white border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "#0d1b3e" }}>
                  {n}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial placeholder */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="text-xl text-gray-700 italic leading-relaxed mb-6">
            &ldquo;ELBOLD Events gives vendors a professional platform that customers trust. I joined early and I&apos;m already receiving enquiries.&rdquo;
          </blockquote>
          <cite className="text-sm text-gray-400 not-italic">— Early access vendor, London</cite>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.55)" }}
          >
            Limited Places Available
          </p>
          <h2
            className="text-3xl font-light tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Ready to be a Founding Vendor?
          </h2>
          <p
            className="font-light mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Apply in minutes. Your profile goes live within 48 hours.
          </p>
          <Link href="/vendor/apply" className="btn-luxury">
            Apply Now — It&apos;s Free
          </Link>
          <p
            className="text-xs font-light mt-6"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            No credit card · No monthly fees · Keep 90% of bookings
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
