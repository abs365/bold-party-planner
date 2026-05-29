import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Star, TrendingUp, Shield, Zap, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Founding Vendor Programme | ELBOLD Events",
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
      <Navbar user={profile} lightBg />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-[#0d1b3e]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold mb-8">
            <Award size={14} />
            Founding Vendor Programme
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Be part of something
            <span style={{ color: "#C9A84C" }}> extraordinary.</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            ELBOLD Events is launching. We&apos;re selecting our first 20 trusted vendors — event professionals who will form the foundation of the UK&apos;s most trusted event marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vendor/apply" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[#0d1b3e] font-bold text-base" style={{ background: "#C9A84C" }}>
              Apply as a Founding Vendor
            </Link>
            <Link href="/browse" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/5 transition-colors">
              Browse the Marketplace
            </Link>
          </div>
          <p className="text-white/40 text-sm mt-6">Limited to the first 20 approved vendors. No credit card required.</p>
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
      <section className="py-20 px-4" style={{ background: "#0d1b3e" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to be a Founding Vendor?</h2>
          <p className="text-white/60 mb-8">
            Join in the next few minutes. Your profile goes live within 48 hours.
          </p>
          <Link href="/vendor/apply" className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-[#0d1b3e] font-bold text-base" style={{ background: "#C9A84C" }}>
            Apply Now — It&apos;s Free
          </Link>
          <p className="text-white/30 text-sm mt-5">No credit card · No monthly fees · Keep 90% of bookings</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
