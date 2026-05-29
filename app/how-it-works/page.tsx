import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle2, Star, Shield, Zap, Calendar, Users, CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How ELBOLD Events connects event hosts with trusted, verified vendors across the United Kingdom.",
};

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
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

      {/* Navy hero */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-5 uppercase"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            How It Works
          </p>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Simple. Trusted. Extraordinary.
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            ELBOLD Events connects event hosts with verified professionals across the United Kingdom.
            Secure payments, real reviews, and end-to-end event coordination.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">

        {/* For Event Hosts */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#0D1B3E" }}
            >
              <Users size={16} style={{ color: "#C9A84C" }} />
            </div>
            <h2 className="text-xl font-light text-gray-900 tracking-tight">For Event Hosts</h2>
          </div>

          <div className="space-y-4">
            {[
              { step: "1", title: "Create your event", desc: "Enter event type, date, city, guest count, and budget. Takes 2 minutes.", icon: Calendar },
              { step: "2", title: "Get your Smart Plan", desc: "Our Smart Planner instantly creates a complete event plan with vendors, budget breakdown, timeline and checklist.", icon: Zap },
              { step: "3", title: "Browse and book vendors", desc: "Browse verified vendors with real photos and videos. See reviews, compare packages and book directly.", icon: Star },
              { step: "4", title: "Pay securely", desc: "Pay the 30% deposit to confirm. All payments go through Stripe, fully protected with dispute resolution.", icon: CreditCard },
              { step: "5", title: "Relax and celebrate", desc: "We handle reminders, confirmations, and post-event reviews. You just show up and enjoy.", icon: CheckCircle2 },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex gap-5 bg-white border border-gray-100 rounded-xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "#0D1B3E", color: "#C9A84C" }}
                >
                  {step}
                </div>
                <div className="flex items-start gap-4">
                  <Icon size={18} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                    <p className="text-gray-400 text-sm mt-1 font-light leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Vendors */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#0D1B3E" }}
            >
              <svg width="16" height="16" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <polygon points="13,1 25,13 13,25 1,13" stroke="#C9A84C" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h2 className="text-xl font-light text-gray-900 tracking-tight">For Vendors</h2>
          </div>

          <div className="space-y-4">
            {[
              { step: "1", title: "Apply for free", desc: "Submit your vendor application in minutes. We review and approve within 24-48 hours." },
              { step: "2", title: "Build your profile", desc: "Upload photos and videos of your work. Add service packages with clear pricing." },
              { step: "3", title: "Receive booking requests", desc: "Customers send requests through the platform. Accept or decline bookings. You are always in control." },
              { step: "4", title: "Get paid automatically", desc: "Payments go through Stripe. You receive 90% of the booking value directly to your account." },
              { step: "5", title: "Build your reputation", desc: "Collect verified reviews after every event. Higher ratings mean more visibility and bookings." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 bg-white border border-gray-100 rounded-xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(13,27,62,0.06)", border: "1px solid rgba(13,27,62,0.15)", color: "#0D1B3E" }}
                >
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                  <p className="text-gray-400 text-sm mt-1 font-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals — navy section */}
        <div
          className="rounded-2xl p-10 mb-16"
          style={{ background: "#0D1B3E" }}
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield size={16} style={{ color: "#C9A84C" }} />
            <h2
              className="text-lg font-light tracking-tight"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Why Trust ELBOLD Events?
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: <CreditCard size={20} />, title: "Secure Payments", desc: "All payments through Stripe. Deposit protection and refund system built in." },
              { icon: <CheckCircle2 size={20} />, title: "Verified Vendors", desc: "Every vendor is reviewed and approved before appearing on our marketplace." },
              { icon: <Star size={20} />, title: "Transparent Reviews", desc: "All reviews are from real, verified bookings. No fake ratings, ever." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}
                >
                  {icon}
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {title}
                </h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/dashboard/create-event" className="btn-luxury-dark text-sm py-3.5 px-8 inline-flex">
            Start Planning Your Event
            <ArrowRight size={14} />
          </Link>
          <p className="text-gray-400 text-xs mt-4 font-light">
            Free account. No commitment.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
