import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, ArrowRight, CheckCircle2, Star, Shield, Zap, Calendar, Users, CreditCard } from "lucide-react";

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
      <Navbar user={profile} lightBg />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-600 text-sm font-semibold uppercase tracking-widest mb-3">Simple & Automated</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How <span className="gradient-brand-text">Bold Party</span> Works
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Our platform handles everything automatically, so you can focus on enjoying your event.
          </p>
        </div>

        {/* For Customers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Users size={22} className="text-brand-600" /> For Event Hosts
          </h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Create your event", desc: "Enter event type, date, city, guest count, and budget. Takes 2 minutes.", icon: Calendar },
              { step: "2", title: "Get your Smart Plan", desc: "Our Smart Planner instantly creates a complete event plan: vendors, budget breakdown, timeline and checklist.", icon: Zap },
              { step: "3", title: "Browse and book vendors", desc: "Browse verified vendors with real photos and videos. See reviews, compare packages, check availability, and book instantly.", icon: Star },
              { step: "4", title: "Pay securely", desc: "Pay the 30% deposit to confirm. Full payment is due before the event. All payments go through Stripe, fully protected.", icon: CreditCard },
              { step: "5", title: "Relax and celebrate", desc: "We handle reminders, confirmations, and post-event reviews. You just show up and enjoy.", icon: CheckCircle2 },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex gap-5 bg-white border border-gray-100 rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                  {step}
                </div>
                <div className="flex items-start gap-4">
                  <Icon size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Vendors */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Sparkles size={22} className="text-brand-600" /> For Vendors
          </h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Apply for free", desc: "Submit your vendor application in minutes. We review and approve within 24–48 hours." },
              { step: "2", title: "Build your profile", desc: "Upload photos and videos of your work, add service packages with clear pricing." },
              { step: "3", title: "Receive booking requests", desc: "Customers send requests through the platform. Accept or decline bookings. You are always in control." },
              { step: "4", title: "Get paid automatically", desc: "Payments go through Stripe. You receive 90% of the booking value directly to your account." },
              { step: "5", title: "Build your reputation", desc: "Collect reviews after every event. Higher ratings = more bookings and featured placement." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 bg-white border border-gray-100 rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold flex-shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-2">
            <Shield size={20} className="text-brand-600" /> Why Trust Bold Party?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: "🔒", title: "Secure Payments", desc: "All payments through Stripe. Deposit protection and refund system built in." },
              { icon: "✅", title: "Verified Vendors", desc: "Every vendor is reviewed and approved before appearing on our marketplace." },
              { icon: "⭐", title: "Transparent Reviews", desc: "All reviews are from real, verified bookings. No fake ratings, ever." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/dashboard/create-event" className="btn-primary text-base py-3.5 px-8 inline-flex">
            <Sparkles size={18} />
            Start Planning Your Event
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
