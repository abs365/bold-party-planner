import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield, CheckCircle2, Star, ArrowRight, Lock, Eye, FileText, AlertCircle, BadgeCheck, Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "The Elbold Trust System | How We Keep Events Safe",
  description:
    "Every vendor reviewed. Every payment protected. Every review from a real booking. Read how Elbold's trust system works, from vendor approval to dispute resolution.",
  openGraph: {
    title: "The Elbold Trust System",
    description: "Vendor verification, payment protection, review integrity, and platform accountability. All explained.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

const TRUST_PILLARS = [
  {
    icon: BadgeCheck,
    label: "Vendor Verification",
    title: "Every vendor is reviewed before they appear.",
    body: "No vendor joins Elbold automatically. Every application is reviewed by a member of our team: portfolio, business identity, pricing, and communication quality. Vendors who do not meet our standards are not approved.",
    link: { label: "How we verify vendors", href: "/how-we-verify" },
    stats: [{ value: "100%", label: "reviewed by a real person" }, { value: "24–48h", label: "typical review time" }],
  },
  {
    icon: Lock,
    label: "Payment Protection",
    title: "Your money is held securely until after your event.",
    body: "All payments go through Stripe, one of the world's most trusted payment processors. Your 30% deposit is not released to the vendor until your event has completed without a dispute. If the vendor cancels, you receive a full refund.",
    link: { label: "Booking protection details", href: "/booking-protection" },
    stats: [{ value: "30%", label: "deposit secured by Stripe" }, { value: "100%", label: "refund if vendor cancels" }],
  },
  {
    icon: Star,
    label: "Review Integrity",
    title: "Every review comes from a confirmed booking.",
    body: "You cannot leave a review on Elbold unless you have made a confirmed booking through the platform. No anonymous reviews. No testimonials solicited outside bookings. No review removal unless it violates our moderation policy.",
    link: { label: "Our review policy", href: "/how-we-verify#reviews" },
    stats: [{ value: "0", label: "anonymous reviews permitted" }, { value: "100%", label: "booking-confirmed only" }],
  },
  {
    icon: FileText,
    label: "Platform Accountability",
    title: "Our standards are published and enforced.",
    body: "Our Vendor Standards are publicly available. Our warning, suspension, and removal policies are documented. Our commitments to customers are specific and checkable. We publish what we do, and what we do not do.",
    link: { label: "Read our commitments", href: "/our-commitments" },
    stats: [{ value: "Public", label: "vendor standards" }, { value: "Public", label: "commitment register" }],
  },
];

const TRUST_LINKS = [
  { icon: Eye,         label: "How We Verify Vendors",     href: "/how-we-verify",      desc: "The full vendor approval process: what we check, what we approve, what we reject." },
  { icon: FileText,   label: "Vendor Standards",           href: "/vendor-standards",   desc: "Minimum requirements for every vendor on the platform, and how we enforce them." },
  { icon: Lock,       label: "Booking Protection",         href: "/booking-protection", desc: "How your deposit is protected, when it is released to vendors, and what happens in a dispute." },
  { icon: CheckCircle2, label: "Our Commitments",          href: "/our-commitments",    desc: "Specific, checkable promises we make to every customer, with honest limitations." },
  { icon: AlertCircle, label: "Dispute Resolution",        href: "/dashboard/bookings", desc: "How to raise a dispute and what happens at each stage of the resolution process." },
  { icon: Shield,     label: "Privacy Policy",             href: "/privacy",            desc: "What data we collect, how we use it, and how we protect it." },
];

export default async function TrustPage() {
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.15)" }}>
            <Shield size={24} style={{ color: "#D4AF37" }} />
          </div>
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
            The Elbold Trust System
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            Trust is not assumed here.
            <br />
            It is built and maintained.
          </h1>
          <p className="text-base font-light max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Vendor verification, payment protection, review integrity, and platform accountability
            work together to make Elbold the most trustworthy event marketplace in the UK.
          </p>
        </div>
      </div>

      {/* ── FOUR PILLARS ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-16">
            {TRUST_PILLARS.map(({ icon: Icon, label, title, body, link, stats }, i) => (
              <div key={label} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(11,31,77,0.07)" }}>
                      <Icon size={16} style={{ color: "#0B1F4D" }} />
                    </div>
                    <span className="text-xs tracking-[0.3em] font-semibold uppercase" style={{ color: "#C9A84C" }}>{label}</span>
                  </div>
                  <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-4 leading-snug">{title}</h2>
                  <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">{body}</p>
                  <Link href={link.href} className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#0B1F4D" }}>
                    {link.label} <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {stats.map(({ value, label: statLabel }) => (
                    <div
                      key={statLabel}
                      className="rounded-2xl p-8 text-center"
                      style={{ background: "#0B1F4D" }}
                    >
                      <div className="text-3xl font-light mb-2" style={{ color: "#D4AF37" }}>{value}</div>
                      <div className="text-xs font-light" style={{ color: "rgba(255,255,255,0.35)" }}>{statLabel}</div>
                    </div>
                  ))}
                  <div
                    className="col-span-2 rounded-2xl p-5 flex items-center gap-3"
                    style={{ background: "rgba(11,31,77,0.04)", border: "1px solid rgba(11,31,77,0.06)" }}
                  >
                    <CheckCircle2 size={14} style={{ color: "#0B1F4D", flexShrink: 0 }} />
                    <p className="text-xs text-gray-500 font-light leading-snug">
                      This is a specific, checkable commitment, not a marketing promise.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST LINK HUB ───────────────────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Trust Documentation
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              Everything published. Nothing hidden.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRUST_LINKS.map(({ icon: Icon, label, href, desc }) => (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group flex flex-col"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5" style={{ background: "rgba(11,31,77,0.06)" }}>
                  <Icon size={15} style={{ color: "#0B1F4D" }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-gray-700">{label}</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed flex-1">{desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-semibold" style={{ color: "#0B1F4D" }}>
                  Read <ArrowRight size={10} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPORT A CONCERN ─────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0B1F4D" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>
            Platform Accountability
          </p>
          <h2 className="text-2xl font-light tracking-tight mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>
            Something not right? Tell us.
          </h2>
          <p className="text-sm font-light leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.38)" }}>
            If a vendor has behaved unprofessionally, a review seems suspicious, a payment is delayed,
            or anything on the platform feels wrong, we want to know. Every report is reviewed by a real person.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/bookings" className="btn-luxury text-sm px-8">
              Report a Vendor Issue
            </Link>
            <a href="mailto:support@elbold.com" className="btn-luxury-outline text-sm px-8">
              Contact Support
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <Users size={12} style={{ color: "rgba(255,255,255,0.18)" }} />
            <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.18)" }}>
              All reports reviewed by the Elbold team within 2 business days
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
