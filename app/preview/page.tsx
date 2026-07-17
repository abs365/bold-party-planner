/**
 * VERSION B — Marketplace-First Homepage Preview
 * Route: /preview
 *
 * This is a design preview only.
 * Production homepage is at app/page.tsx (unchanged).
 * Do not deploy without approval.
 *
 * Differences from Version A:
 * - White background hero (no stock photo)
 * - Typographic-first hero (Stripe/Airbnb philosophy)
 * - Category discovery grid replaces cinematic overlay
 * - Trust bar on light background
 * - All trust sections preserved
 */

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowRight, CheckCircle2, Star, Shield, Award, MapPin,
  Camera, Music, Sparkles, UtensilsCrossed, Building2, Mic2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Version B Preview",
  description: "Internal design preview — not for public use.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "Photographers", icon: Camera,         href: "/browse?category=photographer" },
  { label: "DJs & Music",   icon: Music,           href: "/browse?category=dj" },
  { label: "Decorators",    icon: Sparkles,        href: "/browse?category=decorator" },
  { label: "Catering",      icon: UtensilsCrossed, href: "/browse?category=caterer" },
  { label: "Live Music",    icon: Mic2,            href: "/browse?category=live_band" },
  { label: "Venues",        icon: Building2,       href: "/browse?category=venue_hire" },
];

const QUICK_STARTS = [
  { label: "Weddings",         href: "/browse?event=wedding" },
  { label: "Birthdays",        href: "/browse?event=birthday" },
  { label: "Corporate",        href: "/browse?event=corporate" },
  { label: "Cultural Events",  href: "/browse?event=cultural" },
  { label: "Baby Showers",     href: "/browse?event=baby_shower" },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Browse verified professionals",
    desc: "Filter by category, location, and budget. Every vendor is reviewed by our team before they appear.",
  },
  {
    n: "02",
    title: "Request a free quote",
    desc: "Send your event details directly to the vendors you like. No obligation. Vendors respond within 48 hours.",
  },
  {
    n: "03",
    title: "Book and pay securely",
    desc: "Accept the quote that suits you. Pay a 30% deposit through Stripe. The rest is due after your event.",
  },
];

const TRUST_ITEMS = [
  { icon: CheckCircle2, label: "Every vendor reviewed by us" },
  { icon: Star,         label: "Reviews from real bookings only" },
  { icon: Shield,       label: "Payments secured through Stripe" },
  { icon: Award,        label: "Full refund if vendor cancels" },
  { icon: MapPin,       label: "Based in the United Kingdom" },
];

const PROMISE_STATS = [
  { value: "UK",   label: "Essex · Kent · London" },
  { value: "100%", label: "Individually Reviewed" },
  { value: "90%",  label: "Kept by Every Vendor" },
];

export default async function PreviewHomepage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── PREVIEW BANNER ────────────────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] text-center py-2 text-xs font-semibold tracking-widest uppercase"
        style={{ background: "#D4AF37", color: "#0B1F4D" }}
      >
        ⚡ Version B Preview — Not Deployed — Awaiting Approval
      </div>

      <div className="pt-8">
        <Navbar user={profile} lightBg />
      </div>

      {/* ── SECTION 1: TYPOGRAPHIC HERO ──────────────────────────────────── */}
      <section
        className="pt-32 pb-20 px-4"
        style={{ background: "#ffffff" }}
      >
        <div className="max-w-4xl mx-auto text-center">

          {/* Brand pill */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-10" style={{ background: "rgba(11,31,77,0.15)" }} />
            <span
              className="text-xs tracking-[0.45em] font-medium uppercase"
              style={{ color: "rgba(11,31,77,0.45)" }}
            >
              Trusted Professionals &middot; United Kingdom
            </span>
            <div className="h-px w-10" style={{ background: "rgba(11,31,77,0.15)" }} />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.06] mb-6"
            style={{ color: "#0B1F4D" }}
          >
            Find Trusted Professionals
            <br />
            <span style={{ color: "#D4AF37" }}>For Every Occasion</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-base sm:text-lg font-light leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: "#6b7280" }}
          >
            Every professional on Elbold is reviewed before joining.
            Compare trusted providers, request quotes and book with confidence.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "#0B1F4D", color: "#ffffff", border: "2px solid #0B1F4D" }}
            >
              Find Professionals <ArrowRight size={16} />
            </Link>
            <Link
              href="/founding-vendors"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-80"
              style={{ border: "2px solid #0B1F4D", color: "#0B1F4D", background: "transparent" }}
            >
              Join as a Vendor
            </Link>
          </div>

          {/* Occasion chips */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="text-xs tracking-[0.3em] font-medium uppercase"
              style={{ color: "rgba(11,31,77,0.35)" }}
            >
              What are you planning?
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {QUICK_STARTS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-xs px-4 py-2 rounded-full border font-medium transition-all hover:bg-[#0B1F4D] hover:text-white"
                  style={{
                    borderColor: "rgba(11,31,77,0.2)",
                    color: "#0B1F4D",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CATEGORY GRID ─────────────────────────────────────── */}
      <section className="pb-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:border-[#0B1F4D] hover:shadow-sm"
                style={{ borderColor: "rgba(11,31,77,0.1)", background: "#ffffff" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#0B1F4D]"
                  style={{ background: "rgba(11,31,77,0.06)" }}
                >
                  <Icon size={18} style={{ color: "#0B1F4D" }} className="group-hover:text-white transition-colors" />
                </div>
                <span
                  className="text-xs font-medium text-center leading-tight"
                  style={{ color: "#0B1F4D" }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TRUST BAR ─────────────────────────────────────────── */}
      <section
        style={{ background: "#f8f7f5", borderTop: "1px solid rgba(11,31,77,0.06)", borderBottom: "1px solid rgba(11,31,77,0.06)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2.5 py-1">
                <Icon size={14} style={{ color: "#0B1F4D", opacity: 0.7, flexShrink: 0 }} />
                <span className="text-xs font-light" style={{ color: "#374151" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase"
              style={{ color: "#D4AF37" }}
            >
              How It Works
            </p>
            <h2
              className="text-3xl font-light tracking-tight"
              style={{ color: "#0B1F4D" }}
            >
              From browsing to booked in three steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div
                  className="text-5xl font-light mb-5 leading-none"
                  style={{ color: "rgba(11,31,77,0.08)" }}
                >
                  {n}
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "#0B1F4D" }}
                >
                  {title}
                </h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: "#0B1F4D" }}
            >
              Read how it works in full <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: THE ELBOLD PROMISE ────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0B1F4D" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase"
              style={{ color: "rgba(212,175,55,0.5)" }}
            >
              The Elbold Promise
            </p>
            <h2
              className="text-3xl font-light tracking-tight mb-4"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              A marketplace built on one principle.
              <br />
              <span style={{ color: "#D4AF37" }}>You should be able to trust it.</span>
            </h2>
            <p
              className="text-sm font-light max-w-xl mx-auto leading-relaxed"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              No vendor joins Elbold automatically. No review is unverified. No payment is unprotected.
              These are not aspirations. They are the rules the platform operates by.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[
              {
                icon: CheckCircle2,
                title: "Every vendor reviewed by a human",
                body: "Every application is assessed by our team against published standards before a profile goes live. No automation. No auto-approval.",
              },
              {
                icon: Shield,
                title: "Your deposit is protected by Stripe",
                body: "A 30% deposit secures your booking. All payments are processed by Stripe. Funds are held until your event is complete.",
              },
              {
                icon: Star,
                title: "Reviews only from confirmed bookings",
                body: "You cannot leave a review on Elbold unless you have completed a booking through the platform. No anonymous reviews.",
              },
              {
                icon: Award,
                title: "Full refund if your vendor cancels",
                body: "If your vendor cancels a confirmed booking, you receive a full refund of everything you have paid, with no dispute required.",
              },
              {
                icon: MapPin,
                title: "United Kingdom professionals only",
                body: "Every vendor on Elbold operates in the UK. We verify that the person listing the service is the actual service provider.",
              },
              {
                icon: ArrowRight,
                title: "Our standards are published and enforced",
                body: "Vendor approval criteria, warning procedures, and removal policies are all publicly documented. We hold ourselves to the same standard.",
                link: "/vendor-standards",
              },
            ].map(({ icon: Icon, title, body, link }) => (
              <div
                key={title}
                className="rounded-xl p-6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}
              >
                <Icon size={18} style={{ color: "#D4AF37", marginBottom: "14px" }} />
                <h3 className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {title}
                </h3>
                <p className="text-xs font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {body}
                </p>
                {link && (
                  <Link
                    href={link}
                    className="inline-flex items-center gap-1 text-xs mt-4 font-medium hover:opacity-80 transition-opacity"
                    style={{ color: "#D4AF37" }}
                  >
                    Read more <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-6 pt-12"
            style={{ borderTop: "1px solid rgba(212,175,55,0.07)" }}
          >
            {PROMISE_STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-light tracking-tight mb-1" style={{ color: "#D4AF37" }}>
                  {value}
                </div>
                <div className="text-xs font-light" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FOR VENDORS ───────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p
                className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
                style={{ color: "#C9A84C" }}
              >
                For Event Professionals
              </p>
              <h2
                className="text-3xl font-light tracking-tight mb-5"
                style={{ color: "#0B1F4D" }}
              >
                Grow your business with
                <br />
                customers who are ready to book.
              </h2>
              <p className="text-sm font-light leading-relaxed mb-8" style={{ color: "#6b7280" }}>
                Every visitor on Elbold is actively planning an event. They are searching for a vendor.
                You keep 90% of every booking. Free to join. Commission only when you earn.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Free profile. No subscription to start receiving enquiries.",
                  "Keep 90% of every booking. 10% platform commission on completion only.",
                  "Stripe-secured payments. You never chase invoices.",
                  "Verified reviews from confirmed bookings only.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={15} style={{ color: "#0B1F4D", marginTop: 1, flexShrink: 0 }} />
                    <span className="text-sm font-light" style={{ color: "#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/founding-vendors" className="btn-luxury text-sm px-8">
                Apply as a Founding Vendor <ArrowRight size={14} />
              </Link>
            </div>

            {/* Founding vendor programme card */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#0B1F4D" }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 tracking-[0.15em] uppercase"
                style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.8)" }}
              >
                Founding Vendor Programme
              </div>
              <h3
                className="text-xl font-light tracking-tight mb-4"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                Be one of the first.
                <br />
                Stay at the top permanently.
              </h3>
              <div className="space-y-3 mb-6">
                {[
                  "Founding Vendor badge — permanently on your profile",
                  "Top placement above all vendors who join after you",
                  "First access to every new feature we build",
                  "Limited places. Once closed, the programme does not reopen.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} style={{ color: "#D4AF37", marginTop: 2, flexShrink: 0 }} />
                    <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.6)" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/founding-vendors"
                className="inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-8 py-3 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "#D4AF37", color: "#0B1F4D" }}
              >
                Apply Free <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl font-light tracking-tight mb-5"
            style={{ color: "#0B1F4D" }}
          >
            Every event deserves professionals
            <br />
            you can trust completely.
          </h2>
          <p className="text-base font-light mb-10" style={{ color: "#6b7280" }}>
            Elbold reviews every professional before they join.
            You compare, request quotes, and book with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "#0B1F4D", color: "#ffffff" }}
            >
              Find Professionals <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold px-10 py-4 rounded-lg transition-opacity hover:opacity-80"
              style={{ border: "2px solid rgba(11,31,77,0.2)", color: "#0B1F4D" }}
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
