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
    title: "Free to list. Free forever.",
    description: "Creating and maintaining your profile costs nothing. When a customer books you, you keep 90% of the full payment. No hidden fees, no monthly subscription, no commission creep.",
  },
  {
    icon: Star,
    title: "Founding Vendor badge on your profile",
    description: "Customers browsing ELBOLD see your Founding Vendor badge alongside your listing. Badged and verified vendors consistently receive more enquiries than unverified listings at comparable prices.",
  },
  {
    icon: TrendingUp,
    title: "Permanent top-of-page placement",
    description: "Your profile appears at the top of search results and category pages ahead of every vendor who joins after you. Customers typically contact the first 3–5 vendors they see. That set is yours.",
  },
  {
    icon: Zap,
    title: "First access to new features",
    description: "Founding Vendors are first to access new tools as ELBOLD grows — analytics, promoted listings, review widgets, and more. You help shape what gets built next.",
  },
  {
    icon: Shield,
    title: "Stripe-secured payments on every booking",
    description: "Every booking on ELBOLD goes through Stripe. Your payment is protected, released to you after completion, and covered by our dispute resolution process. You never chase invoices.",
  },
  {
    icon: Award,
    title: "Founding Vendor status — permanent",
    description: "Founding Vendor is not a time-limited promotion. It stays on your profile permanently, distinguishing you from the vendors who joined after the launch period closed.",
  },
];

const STEPS = [
  { n: "1", label: "Apply — takes 5 minutes", sub: "Business name, category, city, pricing. Nothing complicated." },
  { n: "2", label: "We verify and activate you", sub: "Every vendor is reviewed before going live. Usually 24–48 hours." },
  { n: "3", label: "Complete your profile", sub: "Add photos, packages and a bio. Better profiles receive more enquiries." },
  { n: "4", label: "Start receiving enquiries", sub: "Customers searching in your category find your profile and contact you directly." },
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
            Founding Vendor Programme &nbsp;·&nbsp; 20 places available
          </div>
          <h1
            className="text-4xl sm:text-5xl font-light tracking-tight mb-6 leading-tight"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Get discovered by customers
            <br />
            <span style={{ color: "#C9A84C" }}>planning events near you.</span>
          </h1>
          <p
            className="text-lg font-light max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Event hosts use ELBOLD to find and book DJs, photographers, caterers,
            decorators and more. List your services free, keep 90% of every booking,
            and start receiving enquiries within days of going live.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vendor/apply" className="btn-luxury">
              Apply Free — Takes 5 Minutes
            </Link>
            <Link href="/browse" className="btn-luxury-outline">
              See the Marketplace
            </Link>
          </div>
          <p
            className="text-xs font-light mt-7"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            20 founding places available. No credit card. No monthly fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">What you get as a Founding Vendor</h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light">Everything you need to start receiving enquiries from day one, with placement advantages that stay with you permanently.</p>
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
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">From application to first enquiry</h2>
            <p className="text-gray-400 font-light">Four steps. Free throughout. No commitment required.</p>
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

      {/* Trust signals — factual, not fabricated */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">

            <div className="text-center p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#0D1B3E" }}
              >
                <CheckCircle2 size={18} style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Every vendor is reviewed</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                We individually verify every vendor before they appear on the platform. Customers know that means something.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#0D1B3E" }}
              >
                <Shield size={18} style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Payments through Stripe</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Every booking is paid through Stripe. Your earnings are protected and released to you after the event completes.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#0D1B3E" }}
              >
                <Award size={18} style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">No lock-in</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Your profile is free. There is no contract and no minimum term. If ELBOLD does not work for your business, you can leave at any time.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.55)" }}
          >
            20 founding places · Applications open now
          </p>
          <h2
            className="text-3xl font-light tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Start receiving booking enquiries.
          </h2>
          <p
            className="font-light mb-10 leading-relaxed max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Apply in under 5 minutes. We review within 24–48 hours.
            Your profile goes live immediately upon approval.
            Once the 20 founding places are filled, new vendors join a standard queue.
          </p>
          <Link href="/vendor/apply" className="btn-luxury">
            Apply Now — It&apos;s Free
          </Link>
          <p
            className="text-xs font-light mt-6"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            No credit card &nbsp;·&nbsp; No monthly fees &nbsp;·&nbsp; Keep 90% of every booking &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
