import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle2, Star, Shield, Zap, Calendar, Users, CreditCard, ChevronDown, AtSign, MessageSquare, Lock, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How ELBOLD Works | Trusted Event Professionals in 3 Simple Steps",
  description: "Discover how ELBOLD connects you with verified event professionals across the UK. Browse, compare and book trusted DJs, photographers, caterers and decorators with complete confidence.",
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
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            From Idea to Extraordinary Celebration.
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
            ELBOLD connects event hosts with verified, reviewed professionals across the United Kingdom.
            Every vendor is individually approved. Every payment is secured by Stripe.
            Every review comes from a real, completed booking.
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
              { step: "4", title: "Get paid securely", desc: "You receive 90% of every booking. Payouts are processed by the ELBOLD team within 7 working days of event completion, directly to your registered UK bank account." },
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

        {/* Trust signals (navy section) */}
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

        {/* How ELBOLD makes money */}
        <div className="mb-16 border border-gray-100 rounded-2xl p-8">
          <h2 className="text-lg font-light text-gray-900 tracking-tight mb-2">How ELBOLD makes money</h2>
          <p className="text-sm text-gray-400 font-light leading-relaxed mb-5">
            ELBOLD is free to use for event hosts. Vendors list for free and there are no monthly fees required to receive enquiries.
          </p>
          <div className="space-y-3">
            {[
              "ELBOLD earns a 10% service fee on the value of completed bookings. This is deducted from the vendor payout automatically. Customers pay the listed price.",
              "Optional subscription plans are available for vendors who want additional visibility, analytics, or priority placement. These are never required to use the platform.",
              "There are no hidden charges, no sign-up fees, and no fees for browsing or receiving quotes.",
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 size={15} className="text-gray-300 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why ELBOLD instead of Instagram */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div
            className="px-8 py-6"
            style={{ background: "#0D1B3E" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={16} style={{ color: "#C9A84C" }} />
              <h2 className="text-lg font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                Why book through ELBOLD instead of messaging on Instagram?
              </h2>
            </div>
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.4)" }}>
              A question we encourage you to ask. Here is the honest answer.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              {
                icon: Lock,
                title: "Your money is protected",
                elbold: "Your deposit is held by Stripe until your event. If the vendor cancels, you get a full refund. Disputes are handled by ELBOLD.",
                instagram: "You transfer money to a personal account. No recourse if things go wrong.",
              },
              {
                icon: CheckCircle2,
                title: "Vendors are verified",
                elbold: "Every vendor on ELBOLD has been manually reviewed by our team for identity, quality, and legitimacy before they can accept bookings.",
                instagram: "Anyone can create a profile. Follower count is not a quality signal.",
              },
              {
                icon: Star,
                title: "Reviews are real",
                elbold: "Reviews on ELBOLD come exclusively from customers who completed a real booking through the platform. They cannot be faked.",
                instagram: "Comments and testimonials on social media cannot be verified. They can be curated, purchased, or hidden.",
              },
              {
                icon: AlertTriangle,
                title: "Contracts and documentation",
                elbold: "Every booking generates a digital record of what was agreed: service, date, location, payment terms. Both parties have a copy.",
                instagram: "DMs are informal. What was agreed is often disputed. There is no enforceable record.",
              },
            ].map(({ icon: Icon, title, elbold, instagram }) => (
              <div key={title} className="grid sm:grid-cols-[200px_1fr_1fr] gap-0">
                <div className="p-5 flex items-center gap-2.5 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-100">
                  <Icon size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">{title}</span>
                </div>
                <div className="p-5 border-b sm:border-b-0 sm:border-r border-gray-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-emerald-700 mb-1">ELBOLD</div>
                      <p className="text-xs text-gray-600 leading-relaxed">{elbold}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-2">
                    <AtSign size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-1">Social media DM</div>
                      <p className="text-xs text-gray-400 leading-relaxed">{instagram}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-0 border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {[
              {
                q: "Do I pay the full amount upfront?",
                a: "No. You pay a 30% deposit when you confirm the booking. The remaining 70% is due closer to the event date, as agreed with the vendor. Your deposit is held securely and not released to the vendor until your event takes place.",
              },
              {
                q: "Can I cancel my booking?",
                a: "Yes. If you cancel more than 30 days before your event, you receive a full refund of your deposit minus a 5% processing fee. Cancellations within 7 days of the event are non-refundable, as the vendor has reserved that date exclusively for you. Full cancellation terms are at elbold.com/refunds.",
              },
              {
                q: "What if the vendor cancels my booking?",
                a: "If a vendor cancels a confirmed booking, you receive a 100% refund of all amounts paid. We will also assist you in finding a replacement from our approved vendor list. Vendors who cancel confirmed bookings receive a formal warning and may be suspended.",
              },
              {
                q: "What if the vendor doesn't show up?",
                a: "Contact us immediately at urgent@elbold.com. If a vendor fails to appear for a confirmed booking without prior notice, you receive a full refund of all amounts paid. This protection applies to every booking made through ELBOLD.",
              },
              {
                q: "What if I'm unhappy with the service on the day?",
                a: "Contact our team within 48 hours of the event with details of your concern. We will review evidence from both parties and reach a fair resolution within 5 working days. Outcomes may include partial or full refunds depending on the circumstances.",
              },
              {
                q: "How are vendors verified?",
                a: "Every vendor application is reviewed by a member of the ELBOLD team. We assess business identity, portfolio quality, pricing realism, and service legitimacy. No vendor is approved by algorithm. Full details are at elbold.com/how-we-verify.",
              },
              {
                q: "How long does vendor approval take?",
                a: "We review most applications within 24–48 hours. You will receive a confirmation email immediately after submitting, and an approval notification once reviewed. If we have questions about your application, we will contact you directly.",
              },
              {
                q: "Does ELBOLD take a commission from vendors?",
                a: "Yes. ELBOLD earns a 10% service fee on completed bookings, deducted from the vendor payout. Customers pay the listed price, no surcharges. Vendors keep 90% of every booking they accept.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-900">{q}</span>
                  <ChevronDown size={15} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{a}</p>
                </div>
              </details>
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
