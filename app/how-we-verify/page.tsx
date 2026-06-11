import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  CheckCircle2, Shield, BadgeCheck, Eye, Star,
  FileText, Users, TrendingUp, ArrowRight, Lock,
  Phone, AlertTriangle, Clock, Search, ChevronDown,
} from "lucide-react";
import { CATEGORY_REQUIREMENTS, DOCUMENT_LABELS } from "@/lib/verification-requirements";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";

export const metadata: Metadata = {
  title: "How Elbold Verifies Vendors | Every Professional Individually Reviewed",
  description:
    "Learn exactly how Elbold reviews and verifies every event vendor: identity, phone, documents, portfolio, fraud prevention, and ongoing monitoring. Real people reviewing real businesses.",
};

export const dynamic = "force-dynamic";

const VERIFICATION_STEPS = [
  {
    icon: FileText,
    title: "Identity Verification",
    desc: "We confirm the vendor operates under a real business identity. Name, trading description, and service category are checked for accuracy.",
  },
  {
    icon: Phone,
    title: "Contact Verification",
    desc: "A valid UK contact phone number is required. Contact details are cross-referenced with submitted documents during our manual review.",
  },
  {
    icon: Users,
    title: "Document Review",
    desc: "For higher verification tiers, vendors provide business documentation. We review this to confirm the business exists as described.",
  },
  {
    icon: Eye,
    title: "Portfolio Assessment",
    desc: "We review photos and videos of real work. Vendors cannot claim expertise in services they cannot demonstrate with actual examples.",
  },
  {
    icon: Star,
    title: "Quality Assessment",
    desc: "Professionalism, pricing realism, and communication quality are assessed. We reject applications that appear unprepared or misrepresentative.",
  },
  {
    icon: TrendingUp,
    title: "Ongoing Performance Monitoring",
    desc: "Every approved vendor is monitored through customer reviews, booking completion rates, and response patterns after approval.",
  },
];

const VERIFICATION_LEVELS = [
  {
    level: "Elbold Reviewed",
    badge: "Manual review by our team",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    border: "rgba(5,150,105,0.2)",
    desc: "The vendor has been assessed by the Elbold team for identity, business legitimacy, and portfolio quality. This is the baseline standard. Every vendor on Elbold holds this status as a minimum.",
  },
  {
    level: "ID Verified",
    badge: "Government ID confirmed",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
    desc: "The vendor has provided government-issued identification. We have confirmed their legal name matches their business identity. Customers have additional assurance of exactly who they are booking.",
  },
  {
    level: "Business Verified",
    badge: "Documents reviewed",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
    desc: "The vendor has submitted all required business documents for their service category, which may include insurance certificates, professional licences, or trade-specific credentials, and each has been individually reviewed and approved by our team.",
  },
  {
    level: "Premium Partner",
    badge: "Highest verification tier",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.12)",
    border: "rgba(212,175,55,0.3)",
    desc: "Reserved for vendors with an exceptional track record, multiple verified five-star reviews, full identity confirmation, and consistent performance across numerous events. The highest trust tier on Elbold.",
  },
];

const TIMELINE = [
  { day: "Day 1", event: "Application submitted", detail: "Vendor completes the online application form with business details, service category, and initial portfolio." },
  { day: "1–2 days", event: "Initial review", detail: "Our team assesses identity, phone number, and portfolio against our quality standards." },
  { day: "2–5 days", event: "Document review (if required)", detail: "Higher-tier verifications may require additional documentation. We contact the vendor directly." },
  { day: "After approval", event: "Ongoing monitoring begins", detail: "Reviews, completion rates, and response behaviour are tracked continuously from day one of listing." },
];

const FRAUD_MEASURES = [
  {
    title: "Review pattern detection",
    body: "We monitor for unusual spikes in reviews, particularly from accounts with no booking history. Suspicious patterns trigger immediate investigation.",
  },
  {
    title: "Identity cross-referencing",
    body: "Application details are cross-checked against submitted documentation. Inconsistencies result in rejection or suspension pending clarification.",
  },
  {
    title: "Duplicate account detection",
    body: "Vendors removed from the platform for policy violations cannot reapply under a different identity. We have systems in place to detect and reject attempts.",
  },
  {
    title: "Zero tolerance for review manipulation",
    body: "Any vendor found attempting to generate, purchase, or incentivise reviews is permanently removed from the platform and barred from reapplying.",
  },
];

const WHAT_TO_EXPECT = [
  "The vendor profile shows accurate information about their services, experience, and location.",
  "Any verified badge displayed on a profile is genuine and was awarded by our team, not self-assigned.",
  "Reviews on the profile come from real customers who completed bookings through Elbold.",
  "If the vendor's standards change or they underperform, our monitoring systems will flag it.",
  "You can contact our team at any time if you have concerns about a vendor's behaviour or legitimacy.",
];

const DOES_NOT_GUARANTEE = [
  "Verification is our assessment at a point in time. It is not a guarantee of future performance.",
  "We cannot observe every event in person. Our monitoring is based on customer reviews and completion data.",
  "Verified vendors may still make mistakes or fail to meet expectations. Verification assesses legitimacy, not perfection.",
  "Our dispute process aims to be fair to both parties. Outcomes depend on the evidence available in each case.",
];

const FAQS = [
  {
    q: "How long does verification take?",
    a: "Standard applications are reviewed within 24–48 hours. Applications that require document review or further clarification may take up to 5 business days.",
  },
  {
    q: "Can I see a vendor's verification documents?",
    a: "No. Documentation submitted by vendors is confidential and used only for our internal review process. The verification badge on the profile confirms the level of verification completed.",
  },
  {
    q: "What happens if a verified vendor underperforms?",
    a: "If a verified vendor receives consistent poor reviews or fails to complete confirmed bookings, their account is reviewed. We may reduce their visibility, issue formal warnings, or suspend their account depending on the severity.",
  },
  {
    q: "Can vendors pay to get a higher verification badge?",
    a: "No. Verification badges are not available for purchase. They are awarded based entirely on the evidence submitted, our team's assessment, and the vendor's track record on the platform.",
  },
  {
    q: "How are reviews protected from manipulation?",
    a: "Only customers with a confirmed booking can leave a review. We monitor for unusual review patterns and investigate any that appear artificial. Vendors cannot remove negative reviews. They may only post a professional response.",
  },
  {
    q: "What should I do if I suspect a vendor is misrepresenting themselves?",
    a: "Report it to safety@elbold.com. We treat all reports seriously and investigate promptly. If you have already booked and have concerns, contact support@elbold.com.",
  },
];

export default async function HowWeVerifyPage() {
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
            Vendor Verification
          </div>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Every vendor reviewed
            <br />
            <span style={{ color: "#D4AF37" }}>by a real person.</span>
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Not an algorithm. Not an automated check. A member of the Elbold team
            personally reviews every vendor application before they appear on our marketplace.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 space-y-20">

        {/* Section 1: Why verification matters */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(11,31,77,0.03)", border: "1px solid rgba(11,31,77,0.08)" }}
        >
          <CheckCircle2 size={32} className="mx-auto mb-5" style={{ color: "#059669" }} />
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-4">
            Why verification matters
          </h2>
          <p className="text-gray-500 font-light leading-relaxed max-w-xl mx-auto">
            When you trust a vendor with your wedding, birthday, or corporate event,
            you need to know they are who they say they are and that their work is as
            good as they claim. Without a verification process, any marketplace is only
            as trustworthy as its least reliable listing. Elbold&rsquo;s verification exists
            to protect customers and to create a professional community that genuine vendors want to be part of.
          </p>
        </div>

        {/* Section 2-5: Verification steps */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Our Review Process
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              What we check before approving a vendor
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {VERIFICATION_STEPS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-6 rounded-2xl border"
                style={{ background: "#fafafa", borderColor: "#f0f0f0" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#0D1B3E" }}
                >
                  <Icon size={18} style={{ color: "#C9A84C" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Verification timeline */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Verification Timeline
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              From application to live listing
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gray-100" />
            <div className="space-y-6">
              {TIMELINE.map(({ day, event, detail }, i) => (
                <div key={event} className="flex gap-6 relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold z-10"
                    style={{ background: "#0D1B3E", color: "#C9A84C", border: "3px solid white" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{event}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(212,175,55,0.1)", color: "#C9A84C" }}
                      >
                        {day}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-light leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Verification levels */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Verification Levels
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              What each badge means
            </h2>
            <p className="text-gray-400 text-sm font-light max-w-md mx-auto">
              Every vendor on Elbold meets our minimum standard.
              Additional badges indicate a higher level of verified trust.
            </p>
          </div>

          <div className="space-y-4">
            {VERIFICATION_LEVELS.map(({ level, badge, color, bg, border, desc }) => (
              <div
                key={level}
                className="flex gap-4 p-6 rounded-2xl border"
                style={{ background: bg, borderColor: border }}
              >
                <div className="flex-shrink-0 pt-0.5">
                  <BadgeCheck size={22} style={{ color }} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-gray-900">{level}</span>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: bg, color, border: `1px solid ${border}` }}
                    >
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trusted Professional earned badge */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} style={{ color: "#D4AF37" }} fill="currentColor" />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">Trusted Professional (earned badge)</h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed">
            Separate from the verification tiers above, the <strong className="text-gray-700">Trusted Professional</strong> badge is awarded automatically based on performance, not document submission. It requires 5 or more completed bookings, an overall rating of 4.5 stars or higher, a response rate above 80%, and a cancellation rate below 5%. This badge reflects trust earned through real customer experiences.
          </p>
        </div>

        {/* Category-specific document requirements */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Document Requirements
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              What each service type must provide
            </h2>
            <p className="text-gray-400 text-sm font-light max-w-md mx-auto">
              Business Verified vendors have had every document below individually reviewed and approved by our team.
            </p>
          </div>

          <div className="space-y-2">
            {Object.entries(CATEGORY_REQUIREMENTS).map(([cat, docs]) => {
              const catInfo = VENDOR_CATEGORIES[cat as VendorCategory];
              return (
                <details key={cat} className="group border border-gray-100 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-semibold text-gray-900 select-none list-none">
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{catInfo?.icon ?? "🏢"}</span>
                      {catInfo?.label ?? cat.replace(/_/g, " ")}
                    </span>
                    <ChevronDown
                      size={15}
                      className="flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                      style={{ color: "#C9A84C" }}
                    />
                  </summary>
                  <div className="px-6 pb-5">
                    <div className="space-y-2">
                      {(docs ?? []).map((docType) => (
                        <div key={docType} className="flex items-start gap-2.5">
                          <CheckCircle2 size={13} style={{ color: "#059669", flexShrink: 0, marginTop: "3px" }} />
                          <span className="text-sm text-gray-600">{DOCUMENT_LABELS[docType]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {/* Section 7: Fraud prevention */}
        <div
          className="rounded-2xl p-10"
          style={{ background: "#0D1B3E" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
              How we prevent fraud
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FRAUD_MEASURES.map(({ title, body }) => (
              <div key={title}>
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={13} style={{ color: "#C9A84C", flexShrink: 0 }} />
                  <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{title}</h3>
                </div>
                <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Review integrity */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">How reviews stay honest</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                title: "Booking-gated reviews",
                body: "Only customers who completed a real booking through Elbold can leave a review. If you did not book through the platform, you cannot review.",
              },
              {
                title: "No anonymous reviews",
                body: "Every review is attached to a verified account. We know exactly who left every review. Anonymous ratings are not accepted.",
              },
              {
                title: "No review removal for vendors",
                body: "Vendors cannot ask Elbold to remove negative reviews. They may post a professional response. Reviews remain on the profile permanently.",
              },
              {
                title: "No purchased reviews",
                body: "We have systems in place to detect unusual review patterns. Vendors who attempt to generate fake reviews are removed from the platform.",
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

        {/* Section 8: What customers should expect */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              For Customers
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              What you can reasonably expect
            </h2>
          </div>

          <div className="space-y-3">
            {WHAT_TO_EXPECT.map((point) => (
              <div key={point} className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50">
                <CheckCircle2 size={16} style={{ color: "#059669", flexShrink: 0, marginTop: "2px" }} />
                <p className="text-sm text-gray-600 font-light leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 9: What verification does not guarantee */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} style={{ color: "#C9A84C" }} />
            <h2 className="text-lg font-light text-gray-900 tracking-tight">
              What verification does not guarantee
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
            We believe transparency builds more trust than overpromising. Verification is meaningful,
            but it has honest limits.
          </p>
          <div className="space-y-3">
            {DOES_NOT_GUARANTEE.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <AlertTriangle size={13} style={{ color: "#C9A84C", flexShrink: 0, marginTop: "3px" }} />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ongoing monitoring */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <h2 className="text-lg font-light text-gray-900 tracking-tight mb-2">
            Verification does not end at approval
          </h2>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
            Approval is the beginning of the vendor relationship, not the end of our oversight.
            Every approved vendor is monitored across three dimensions:
          </p>
          <div className="space-y-3">
            {[
              "Customer reviews: we read every review and flag patterns of concern",
              "Booking completion rate: vendors who cancel confirmed bookings receive formal warnings",
              "Response behaviour: vendors with consistently poor response rates receive reduced marketplace visibility",
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

        {/* CTAs */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-light text-gray-900">
            Ready to find a verified vendor for your event?
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse" className="btn-luxury-dark text-sm py-3.5 px-8 inline-flex">
              Browse Verified Vendors
              <ArrowRight size={14} />
            </Link>
            <Link href="/booking-protection" className="btn-secondary-light text-sm py-3.5 px-8 inline-flex">
              How Booking Protection Works
            </Link>
          </div>
          <p className="text-gray-400 text-xs font-light">Free to browse &middot; No commitment &middot; Quote in minutes</p>
        </div>

      </div>

      <Footer />
    </div>
  );
}
