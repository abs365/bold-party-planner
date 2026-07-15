import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  Shield, CheckCircle2, Lock, CreditCard, AlertTriangle,
  ArrowRight, FileText, Users, Clock, Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Booking Protection | How Elbold Keeps Your Money Safe",
  description:
    "Every booking made through Elbold is protected. Stripe-secured deposits, full refunds if vendors cancel, formal dispute resolution. Here is exactly how it works.",
};

export const dynamic = "force-dynamic";

const PROMISE_POINTS = [
  {
    icon: Lock,
    title: "Your payment is secured through Stripe",
    body: "Every deposit paid through Elbold is processed by Stripe. Payments are held by Elbold and not released to vendors until after your event is completed.",
  },
  {
    icon: CheckCircle2,
    title: "Full refund if the vendor cancels",
    body: "If a vendor cancels a confirmed booking for any reason, you are entitled to a 100% refund of all amounts paid. We also assist you in finding a replacement vendor.",
  },
  {
    icon: Shield,
    title: "Dispute resolution if something goes wrong",
    body: "If the service delivered does not match what was agreed, you can raise a formal dispute. Our team will review evidence from both parties and reach a determination within 5 business days.",
  },
];

const REFUND_POLICY = [
  { period: "More than 30 days before the event", outcome: "Full refund of the deposit, minus a 5% processing fee" },
  { period: "15–30 days before the event", outcome: "50% refund of amounts paid" },
  { period: "8–14 days before the event", outcome: "25% refund of amounts paid" },
  { period: "7 days or fewer before the event", outcome: "No refund. The vendor has reserved this date exclusively for your event." },
];

const CUSTOMER_RESPONSIBILITIES = [
  "Read the vendor's profile, package description, and contract carefully before confirming a booking.",
  "Provide accurate event details including date, location, guest numbers, and specific requirements.",
  "Communicate changes to requirements promptly and in writing through the Elbold platform.",
  "Raise disputes within 48 hours of the event if the service was not delivered as agreed.",
  "Do not attempt to circumvent the platform by paying vendors outside of Elbold, as doing so removes all protections.",
];

const VENDOR_RESPONSIBILITIES = [
  "Vendors must deliver the service as described in their profile and the confirmed booking contract.",
  "Vendors must provide at least 72 hours notice if they cannot fulfil a booking due to an emergency.",
  "Vendors must respond to customer enquiries within a reasonable timeframe and maintain professional conduct.",
  "Vendors who cancel confirmed bookings receive a formal warning. Repeat cancellations result in account suspension.",
  "Vendors are not entitled to payment until the event has been completed and is not subject to a valid dispute.",
];

const FAQS = [
  {
    q: "When does the vendor receive my payment?",
    a: "The vendor receives their share of the booking payment after your event is marked as complete and any dispute window has passed. Deposits are held by Elbold and processed securely through Stripe throughout the booking period.",
  },
  {
    q: "What is the deposit amount?",
    a: "A 30% deposit is required to confirm a booking. The remaining 70% is due based on the terms agreed with the vendor.",
  },
  {
    q: "What counts as 'service not delivered as agreed'?",
    a: "Examples include: the vendor did not appear, the service lasted significantly less time than agreed, key elements of the agreed package were missing, or the quality was materially below the standard described. Minor variations in style or personal preference are not grounds for a dispute.",
  },
  {
    q: "What happens if I cannot resolve a dispute with the vendor directly?",
    a: "Email disputes@elbold.com within 48 hours of the event with your evidence. Our team will contact both parties, review the evidence, and make a fair determination within 5 business days.",
  },
  {
    q: "Am I protected if I pay outside of Elbold?",
    a: "No. Our protection only applies to payments processed through the Elbold platform. Paying a vendor directly by bank transfer or cash removes all protections described on this page.",
  },
  {
    q: "What if I need to cancel close to the event?",
    a: "Cancellation within 7 days of the event does not entitle you to a refund, as the vendor has allocated that date and may have turned down other bookings. We recommend ensuring you have appropriate event insurance for situations beyond your control.",
  },
];

export default async function BookingProtectionPage() {
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
            <Shield size={12} />
            Booking Protection
          </div>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Your money is never
            <br />
            <span style={{ color: "#D4AF37" }}>at risk on Elbold.</span>
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every booking made through Elbold is protected. Here is exactly what that means,
            and what you are entitled to if something goes wrong.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 space-y-20">

        {/* Core promise callout */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #162447 100%)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <Lock size={28} className="mx-auto mb-5" style={{ color: "#D4AF37" }} />
          <p
            className="text-lg sm:text-xl font-light tracking-tight max-w-2xl mx-auto leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            &ldquo;Your payment is never sent directly to a vendor without platform controls.&rdquo;
          </p>
          <p className="text-sm font-light max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.38)" }}>
            All Elbold payments are processed and secured by Stripe. Funds are held by Elbold until your event is complete. Vendors receive payment only after delivery.
          </p>
        </div>

        {/* The three promises */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              The Elbold Promise
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              What every booking includes
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {PROMISE_POINTS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl p-7 border border-gray-100 flex flex-col"
                style={{ background: "#fafafa" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "#0D1B3E" }}
                >
                  <Icon size={20} style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-3">{title}</h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed flex-1">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How Stripe protects your payment */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">How Stripe protects your payment</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                title: "PCI-DSS Level 1 compliance",
                body: "Stripe is the highest level of payment security certification available. Your card details are never stored on Elbold servers.",
              },
              {
                title: "Deposit held until completion",
                body: "Your 30% deposit is held by Elbold and processed through Stripe. It is not released to the vendor until your event is confirmed complete.",
              },
              {
                title: "No direct vendor transfers",
                body: "You are never asked to pay a vendor by bank transfer, PayPal, or cash. All funds flow through Elbold's protected payment system.",
              },
              {
                title: "Refunds processed directly to your card",
                body: "Approved refunds are returned directly to the card used to pay. Typical processing time is 5–10 business days, plus your bank's processing time.",
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 size={13} style={{ color: "#059669" }} />
                  <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm font-light leading-relaxed text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Refund policy table */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Cancellation Policy
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              Customer cancellation refunds
            </h2>
            <p className="text-gray-400 text-sm font-light mt-3 max-w-md mx-auto">
              If you need to cancel a booking, the following policy applies. Vendor cancellations
              always result in a full refund regardless of timing.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", background: "#0D1B3E" }}>
              <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                Time before event
              </div>
              <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                Refund entitlement
              </div>
            </div>
            {REFUND_POLICY.map(({ period, outcome }, i) => (
              <div
                key={period}
                className="grid border-b border-gray-100"
                style={{ gridTemplateColumns: "1fr 1fr", background: i % 2 === 0 ? "#ffffff" : "#fafafa" }}
              >
                <div className="px-6 py-4 text-sm font-medium text-gray-700">{period}</div>
                <div className="px-6 py-4 text-sm text-gray-500 font-light">{outcome}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-light mt-3 text-center">
            Vendor cancellations always result in a 100% refund, regardless of timing.
          </p>
        </div>

        {/* No-show protection */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(5,150,105,0.05)", border: "1px solid rgba(5,150,105,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: "#059669" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">No-show protection</h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
            If a vendor fails to appear for a confirmed booking without prior notice, you are entitled to:
          </p>
          <div className="space-y-3 mb-6">
            {[
              "A full refund of all amounts paid",
              "Priority support to help you find a replacement vendor",
              "A formal complaint filed against the vendor",
            ].map((point) => (
              <div key={point} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} style={{ color: "#059669" }} />
                <span className="text-sm text-gray-700">{point}</span>
              </div>
            ))}
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.15)" }}
          >
            <p className="text-sm text-gray-700 font-light">
              <strong className="font-semibold">Report a no-show immediately:</strong>{" "}
              Email <a href="mailto:urgent@elbold.com" className="underline">urgent@elbold.com</a>.
              We monitor this address and will respond as a matter of priority.
            </p>
          </div>
        </div>

        {/* Dispute process */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Dispute Resolution
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              If the service was not delivered as agreed
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { n: "1", title: "Raise a dispute within 48 hours", detail: "Email disputes@elbold.com within 48 hours of the event. Include your booking reference, a description of the issue, and any supporting evidence (photos, messages, contracts)." },
              { n: "2", title: "We contact both parties", detail: "We will contact you and the vendor to gather statements and any additional evidence. Both parties have an equal opportunity to present their case." },
              { n: "3", title: "Our team makes a determination", detail: "Our team reviews all evidence and makes a fair determination within 5 business days. Possible outcomes include full refund, partial refund, or no refund, depending on the circumstances." },
              { n: "4", title: "Resolution communicated to both parties", detail: "Both parties are notified of the outcome. Approved refunds are processed within 5–10 business days. Decisions are final unless new evidence is submitted." },
            ].map(({ n, title, detail }) => (
              <div key={n} className="flex gap-5 p-6 rounded-2xl border border-gray-100">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: "#0D1B3E", color: "#C9A84C" }}
                >
                  {n}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer responsibilities */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">Customer responsibilities</h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
            Our protection exists to resolve genuine problems. To remain covered, customers agree to the following:
          </p>
          <div className="space-y-3">
            {CUSTOMER_RESPONSIBILITIES.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 size={14} className="text-gray-300 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor responsibilities */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">Vendor responsibilities</h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
            Vendors on Elbold agree to uphold these standards as a condition of their approval:
          </p>
          <div className="space-y-3">
            {VENDOR_RESPONSIBILITIES.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 size={14} className="text-gray-300 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-light text-gray-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group border border-gray-100 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer text-sm font-semibold text-gray-900 select-none list-none">
                  {q}
                  <Search
                    size={15}
                    className="flex-shrink-0 transition-transform duration-200 group-open:rotate-90"
                    style={{ color: "#C9A84C" }}
                  />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* What is not covered */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-base font-semibold text-gray-900">What is not covered</h2>
          </div>
          <div className="space-y-2">
            {[
              "Payments made outside of the Elbold platform",
              "Disputes raised more than 48 hours after the event",
              "Disagreements about artistic style or personal taste where the agreed service was delivered",
              "Force majeure events where neither party is at fault (we will work with both parties on rescheduling or refunds)",
            ].map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <AlertTriangle size={12} style={{ color: "#C9A84C", flexShrink: 0, marginTop: "4px" }} />
                <p className="text-sm text-gray-500 font-light">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
        >
          <Clock size={24} className="mx-auto mb-4" style={{ color: "#C9A84C" }} />
          <h2 className="text-xl font-light text-gray-900 mb-3">Need help with a booking?</h2>
          <p className="text-sm text-gray-500 font-light mb-6 max-w-md mx-auto">
            Our support team is here to help. We aim to respond to all enquiries within one business day.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="mailto:support@elbold.com"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium transition-colors"
              style={{ background: "#0D1B3E", color: "#D4AF37" }}
            >
              support@elbold.com
            </a>
            <a
              href="mailto:disputes@elbold.com"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              disputes@elbold.com
            </a>
          </div>
        </div>

        {/* Related */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/how-we-verify" className="btn-luxury-dark text-sm py-3.5 px-8 inline-flex">
              How We Verify Vendors
              <ArrowRight size={14} />
            </Link>
            <Link href="/refunds" className="btn-secondary-light text-sm py-3.5 px-8 inline-flex">
              Full Refund Policy
            </Link>
            <Link href="/why-elbold" className="btn-secondary-light text-sm py-3.5 px-8 inline-flex">
              Why Book Through Elbold
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
