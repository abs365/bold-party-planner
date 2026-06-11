import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  CheckCircle2, XCircle, Shield, Star, Lock,
  FileText, Search, ArrowRight, BadgeCheck, AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Why Book Through Elbold? | Safer Than Social Media Booking",
  description:
    "Discover why booking event vendors through Elbold is safer than Instagram DMs or WhatsApp. Verified vendors, Stripe-secured payments, full dispute protection.",
};

export const dynamic = "force-dynamic";

const COMPARISON_ROWS = [
  {
    feature: "Vendor Verification",
    elbold: "Every vendor manually reviewed by our team before listing",
    social: "No verification. Any account can advertise services.",
  },
  {
    feature: "Verified Reviews",
    elbold: "Only customers with completed bookings can leave reviews",
    social: "Anyone can comment or post, with no way to confirm they booked.",
  },
  {
    feature: "Payment Security",
    elbold: "Your deposit is processed through Stripe and managed by Elbold until the event is complete",
    social: "Bank transfer or cash. Money leaves immediately with no protection.",
  },
  {
    feature: "Refund if Vendor Cancels",
    elbold: "100% refund processed automatically",
    social: "No recourse. Outcome depends entirely on the vendor.",
  },
  {
    feature: "Dispute Resolution",
    elbold: "Dedicated review process, resolved within 5 business days",
    social: "No dispute process. You are on your own.",
  },
  {
    feature: "Booking Terms",
    elbold: "Booking terms recorded at payment. Payment processed through Stripe, managed by Elbold, not the vendor.",
    social: "Usually verbal, with no written record of what was agreed.",
  },
  {
    feature: "Vendor Discovery",
    elbold: "Search by category, location, budget, and event type",
    social: "Hashtag search and personal recommendations only",
  },
];

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Only verified professionals",
    body: "Every vendor on Elbold has been manually reviewed by a member of our team before appearing on the marketplace. We check business identity, portfolio quality, and service legitimacy. Social media has no equivalent. Anyone with an account can advertise event services.",
    link: "/how-we-verify",
    linkLabel: "How we verify vendors",
  },
  {
    icon: Lock,
    title: "Your money is protected",
    body: "All payments go through Stripe, one of the world's most trusted payment processors. Your deposit is processed securely through Stripe and managed by Elbold until after your event is completed. With social media DM bookings, money typically transfers directly to the vendor, and if something goes wrong, there is no mechanism to recover it.",
    link: "/booking-protection",
    linkLabel: "How booking protection works",
  },
  {
    icon: Star,
    title: "Reviews you can trust",
    body: "Every review on Elbold comes from a verified customer who completed a real booking through the platform. Reviews from unverified customers are not accepted. On social media, reviews can be fabricated, incentivised, or selectively removed by the business owner.",
    link: "/how-we-verify",
    linkLabel: "Our review integrity standards",
  },
  {
    icon: Shield,
    title: "When things go wrong",
    body: "Elbold has a formal dispute resolution process. If a vendor underdelivers or fails to appear, contact our team with evidence and we will make a fair determination within 5 business days. With social media bookings, there is no intermediary. Any dispute is entirely between you and the vendor.",
    link: "/booking-protection",
    linkLabel: "Our dispute process",
  },
];

const FAQS = [
  {
    q: "Is it more expensive to book through Elbold?",
    a: "Elbold does not charge customers a booking fee. You pay exactly what the vendor quotes. The vendor pays a small platform commission from their earnings. This does not affect your price.",
  },
  {
    q: "What if I already know the vendor personally?",
    a: "You can still book through Elbold even if you have an existing relationship with the vendor. The platform protects both parties: you have payment security and Stripe-held funds, and the vendor has a clear booking record of what was agreed.",
  },
  {
    q: "Does Elbold guarantee that events will go perfectly?",
    a: "No platform can guarantee that. What we can say: every vendor is verified before listing, your payment is protected throughout, and if something goes wrong, we have a structured process to resolve it fairly.",
  },
  {
    q: "What if the vendor does not show up?",
    a: "If a vendor fails to appear for a confirmed booking, you are entitled to a full refund of all amounts paid. Contact urgent@elbold.com immediately. We monitor this address and will respond as a priority.",
  },
  {
    q: "Can I negotiate directly with the vendor?",
    a: "Yes. Once you submit a quote request, you can communicate directly with the vendor to discuss requirements, packages, and event specifics. Elbold facilitates the relationship. It does not restrict it.",
  },
];

export default async function WhyElboldPage() {
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
            Why Elbold
          </div>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Booking through social media
            <br />
            <span style={{ color: "#D4AF37" }}>leaves you unprotected.</span>
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
            Elbold exists because too many people have lost money, missed events, or dealt with
            unreliable vendors found through Instagram DMs or WhatsApp recommendations.
            We built a safer way to find and book verified event professionals.
          </p>
          <div
            className="inline-flex items-start gap-3 px-5 py-4 rounded-2xl text-left max-w-md mx-auto"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            <AlertTriangle size={16} style={{ color: "#D4AF37", flexShrink: 0, marginTop: "2px" }} />
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.65)" }}>
              When something goes wrong with a social media booking,
              there is no-one to call. With Elbold, there is.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-20 space-y-20">

        {/* Comparison table */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Side by Side
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              Elbold vs booking on social media
            </h2>
            <p className="text-gray-400 text-sm font-light mt-3 max-w-md mx-auto">
              Instagram, Facebook, and WhatsApp are communication tools, not booking platforms.
              This is what that difference means for you.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#0D1B3E" }}>
                  <th className="text-left px-6 py-4 text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)", width: "30%" }}>
                    What you need
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-center" style={{ color: "#D4AF37", width: "35%" }}>
                    Elbold
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-center" style={{ color: "rgba(255,255,255,0.4)", width: "35%" }}>
                    Social media DM
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}
                  >
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-gray-900">{row.feature}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#059669" }} />
                        <span className="text-sm text-gray-600">{row.elbold}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2">
                        <XCircle size={15} className="flex-shrink-0 mt-0.5 text-gray-300" />
                        <span className="text-sm text-gray-400">{row.social}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.feature} className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-4 py-3" style={{ background: "#0D1B3E" }}>
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {row.feature}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#059669" }} />
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#C9A84C" }}>Elbold</div>
                      <p className="text-sm text-gray-700">{row.elbold}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle size={14} className="flex-shrink-0 mt-0.5 text-gray-300" />
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Social media</div>
                      <p className="text-sm text-gray-400">{row.social}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Four pillars */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              The Difference
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              What Elbold provides that social media cannot
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {PILLARS.map(({ icon: Icon, title, body, link, linkLabel }) => (
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
                <h3 className="font-semibold text-gray-900 text-base mb-3">{title}</h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed flex-1 mb-5">{body}</p>
                <Link
                  href={link}
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "#0D1B3E" }}
                >
                  {linkLabel}
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Payment safety callout */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #162447 100%)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <Lock size={28} className="mx-auto mb-5" style={{ color: "#D4AF37" }} />
          <p
            className="text-lg sm:text-xl font-light tracking-tight max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            &ldquo;Your payment is never sent directly to a vendor without platform controls.&rdquo;
          </p>
          <p className="text-sm font-light mt-4 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.38)" }}>
            Every penny transacted through Elbold is processed by Stripe and held in a
            protected account until your event is confirmed complete. Vendors do not
            receive payment until you have received the service.
          </p>
        </div>

        {/* What we don't do */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">What we do not claim</h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
            We believe honest platforms build more trust than ones that overpromise.
            Here is what Elbold does not guarantee:
          </p>
          <div className="space-y-3">
            {[
              "We cannot guarantee that every event will be perfect. We can only ensure every vendor has been reviewed and payments are protected.",
              "We cannot guarantee vendor availability. You should always confirm dates directly with the vendor after submitting a quote request.",
              "Verification is our assessment at a point in time. We monitor ongoing performance but cannot observe every event.",
              "Our dispute process aims to be fair to both parties. Outcomes depend on the evidence available and the circumstances of each case.",
            ].map((point) => (
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
            <h2 className="text-2xl font-light text-gray-900 tracking-tight">Common questions</h2>
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

        {/* CTA */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
        >
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-3">
            Ready to book safely?
          </h2>
          <p className="text-gray-500 font-light text-sm mb-8 max-w-md mx-auto">
            Browse verified vendors across the UK. No booking fee. No commitment until you confirm.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse" className="btn-luxury-dark text-sm py-3.5 px-8 inline-flex">
              Browse Verified Vendors
              <ArrowRight size={14} />
            </Link>
            <Link href="/how-we-verify" className="btn-secondary-light text-sm py-3.5 px-8 inline-flex">
              How We Verify Vendors
            </Link>
          </div>
          <p className="text-gray-400 text-xs font-light mt-5">
            Free to browse &nbsp;&middot;&nbsp; Free quote requests &nbsp;&middot;&nbsp; No obligation
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}
