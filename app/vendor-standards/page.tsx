import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, Shield,
  Clock, Image as ImageIcon, Star, Phone, MessageSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Vendor Standards | What We Expect From Every Elbold Professional",
  description:
    "Read Elbold's vendor approval requirements, quality expectations, warning system, suspension process, and removal criteria. Published openly so every customer knows what standard to expect.",
  openGraph: {
    title: "Elbold Vendor Standards",
    description: "Approval requirements, quality expectations, and the warning system. Published openly.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

const APPROVAL_CRITERIA = [
  { icon: ImageIcon, label: "Portfolio quality", text: "A portfolio demonstrating real, recent, personal work. Stock imagery, AI-generated images, and work from other businesses are not permitted." },
  { icon: Star, label: "Service clarity", text: "Clear service description, realistic pricing that reflects actual offerings, and at least one service package with accurate inclusions." },
  { icon: Shield, label: "Identity", text: "A real business name and the ability to confirm that the applicant is the actual service provider. We reserve the right to request additional identity evidence." },
  { icon: Phone, label: "Reachability", text: "A working contact method and a commitment to respond to customer enquiries within 24 hours of receipt." },
  { icon: MessageSquare, label: "Communication", text: "An application that demonstrates professional communication. Vendors who are difficult to correspond with before approval are not approved." },
  { icon: CheckCircle2, label: "Agreement to standards", text: "Explicit agreement to these Vendor Standards, our Terms of Service, and our dispute resolution process as a condition of approval." },
];

const ONGOING_STANDARDS = [
  { title: "Portfolio accuracy", desc: "Your portfolio must represent your current capability and personal work at all times. Do not add work that is not yours. Do not remove work to conceal your actual standard." },
  { title: "Pricing honesty", desc: "Prices displayed on your profile must be accurate. Customers who receive quotes significantly higher than your displayed pricing without clear justification may trigger a review." },
  { title: "Response commitment", desc: "Respond to all customer enquiries within 24 hours. Repeated unresponsiveness after customer enquiries will result in a formal warning." },
  { title: "Event reliability", desc: "Show up. Deliver what you committed to. If you cannot attend a confirmed booking, notify the customer and Elbold immediately. Unexplained no-shows result in immediate suspension." },
  { title: "Professional conduct", desc: "Treat all customers with professionalism, both through the platform and at events. Discriminatory behaviour, harassment, or aggressive communication are grounds for immediate removal." },
  { title: "Honest reviews", desc: "You may respond to reviews through your profile. You may not solicit fake reviews, incentivise positive reviews, or attempt to suppress negative ones. Doing so results in removal." },
];

const WARNING_LEVELS = [
  {
    level: "Stage 1: Guidance",
    icon: AlertTriangle,
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.06)",
    border: "rgba(201,168,76,0.15)",
    triggers: [
      "Slow response to customer enquiries (48–72 hours)",
      "Minor portfolio inaccuracies, quickly corrected",
      "A single low-rated review with no pattern of complaints",
    ],
    outcome: "We contact you directly with specific guidance. No record on your public profile. Corrective action expected within 7 days.",
  },
  {
    level: "Stage 2: Formal Warning",
    icon: AlertTriangle,
    color: "#E5A52A",
    bg: "rgba(229,165,42,0.06)",
    border: "rgba(229,165,42,0.18)",
    triggers: [
      "Repeated unresponsiveness after Stage 1 guidance",
      "Portfolio containing work not belonging to the vendor",
      "Two or more substantiated customer complaints",
      "Undisclosed pricing or service changes after booking",
    ],
    outcome: "Formal written warning issued. Profile visibility may be reduced. 14-day window to address specific issues. Recorded internally.",
  },
  {
    level: "Stage 3: Suspension",
    icon: XCircle,
    color: "#E05C3A",
    bg: "rgba(224,92,58,0.06)",
    border: "rgba(224,92,58,0.18)",
    triggers: [
      "Stage 2 issues unresolved after the 14-day window",
      "Confirmed event no-show where customer was not informed",
      "Active dispute with customer that suggests professional misconduct",
      "Three or more substantiated complaints in a 6-month period",
    ],
    outcome: "Profile suspended from the public platform. Active bookings are not affected. Suspension review within 7 business days. Vendor may submit a response.",
  },
  {
    level: "Stage 4: Permanent Removal",
    icon: XCircle,
    color: "#C03A2A",
    bg: "rgba(192,58,42,0.05)",
    border: "rgba(192,58,42,0.18)",
    triggers: [
      "Fraud: falsified portfolio, fake reviews, or misrepresentation",
      "Confirmed no-show at a customer event with no contact",
      "Discriminatory, abusive, or threatening conduct",
      "Confirmed financial misconduct relating to a customer booking",
      "Suspension review confirming serious breach of standards",
    ],
    outcome: "Profile permanently removed. All associated accounts blocked. Any deposits held are released to the customer. No re-application accepted.",
  },
];

export default async function VendorStandardsPage() {
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

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="pt-16" style={{ background: "#0B1F4D" }}>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
            Elbold Vendor Standards
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            What we expect from every
            <br />
            vendor. Published openly.
          </h1>
          <p className="text-base font-light max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.45)" }}>
            These standards are not aspirational guidelines. They are the minimum requirements for joining
            Elbold and the criteria we use when issuing warnings, suspensions, and removals.
            Customers can read them. Vendors should know them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vendor/apply" className="btn-luxury text-sm">
              Apply to Join Elbold <ArrowRight size={14} />
            </Link>
            <Link href="/trust" className="btn-luxury-outline text-sm">
              Our Trust System
            </Link>
          </div>
        </div>
      </div>

      {/* ── APPROVAL CRITERIA ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Section 1
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              What we assess during approval.
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-xl">
              Every vendor application is reviewed against these criteria by a member of the Elbold team.
              Applications that do not meet the standard are declined. No exceptions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {APPROVAL_CRITERIA.map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(11,31,77,0.06)" }}>
                  <Icon size={15} style={{ color: "#0B1F4D" }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{label}</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONGOING STANDARDS ────────────────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Section 2
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              Standards that apply after approval.
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-xl">
              Approval is the start, not the finish. These standards apply throughout your time on the platform.
              Failure to maintain them triggers our progressive warning system.
            </p>
          </div>

          <div className="space-y-3">
            {ONGOING_STANDARDS.map(({ title, desc }) => (
              <div key={title} className="flex gap-5 bg-white rounded-xl p-6 border border-gray-100">
                <CheckCircle2 size={15} style={{ color: "#0B1F4D", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WARNING SYSTEM ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Section 3
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              The progressive warning system.
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-xl">
              We do not remove vendors without warning, except in cases of serious misconduct.
              Our four-stage system gives vendors the opportunity to correct issues before consequences escalate.
            </p>
          </div>

          <div className="space-y-5">
            {WARNING_LEVELS.map(({ level, icon: Icon, color, bg, border, triggers, outcome }) => (
              <div
                key={level}
                className="rounded-2xl p-8 border"
                style={{ background: bg, borderColor: border }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <Icon size={18} style={{ color }} />
                  <h3 className="font-semibold text-gray-900 text-sm">{level}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Triggers</p>
                    <ul className="space-y-2">
                      {triggers.map((t) => (
                        <li key={t} className="flex items-start gap-2 text-xs text-gray-600 font-light">
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Outcome</p>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">{outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPEALS ──────────────────────────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-20 px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Section 4
            </p>
            <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-3">
              Right of appeal.
            </h2>
          </div>
          <div className="space-y-4 text-sm text-gray-600 font-light leading-relaxed">
            <p>
              Vendors who receive a Stage 2 warning or Stage 3 suspension may submit a written appeal
              within 14 days of notification. Appeals should be sent to{" "}
              <a href="mailto:standards@elbold.com" className="font-semibold text-gray-900 hover:underline">standards@elbold.com</a>{" "}
              with a clear explanation of the vendor&apos;s position and any supporting evidence.
            </p>
            <p>
              Elbold will review appeals within 7 business days and provide a written response.
              The appeal decision is final. Vendors who are permanently removed following an appeal
              may not re-apply to the platform.
            </p>
            <p>
              Stage 4 removals for fraud, no-shows, or discriminatory conduct are not subject to appeal.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a href="mailto:standards@elbold.com" className="btn-luxury-dark text-sm">
              Submit an Appeal
            </a>
            <Link href="/vendor/apply" className="btn-secondary-light text-sm">
              Apply to Join Elbold
            </Link>
          </div>
        </div>
      </section>

      {/* ── LAST UPDATED ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-light">
            These standards were last reviewed and updated in June 2026.
            Elbold reserves the right to update these standards with 30 days notice to active vendors.
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/trust" className="text-gray-400 hover:text-gray-700 transition-colors font-light">Trust Hub</Link>
            <Link href="/our-commitments" className="text-gray-400 hover:text-gray-700 transition-colors font-light">Our Commitments</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
