import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  CheckCircle2,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Award,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Join as a Founding Vendor | Grow Your Business Free",
  description:
    "Be one of Elbold's first verified event professionals anywhere in the UK. Free profile, permanent priority placement, and the exclusive Founding Vendor badge. Reach customers actively searching for event professionals, not just browsing a social media feed.",
  openGraph: {
    title: "Founding Vendor Programme | Elbold",
    description:
      "Free profile. Verified badge. Permanent top placement.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

const BENEFITS = [
  {
    icon: Zap,
    title: "A full business dashboard. Already live.",
    description:
      "Revenue analytics, client CRM, direct contact tracking, lead funnel reporting, availability calendar and booking intelligence are already live — real tools for running your business, not just a listing. Founding Vendors access every tool as it ships, before any vendor who joins later.",
  },
  {
    icon: CheckCircle2,
    title: "Start free, upgrade when you're ready to grow.",
    description:
      "Creating your profile and receiving enquiries costs nothing. Elbold earns a fair, transparent 10% commission on marketplace bookings — charged only when you've been paid — so our incentives are aligned with yours. Paid plans unlock deeper business tools whenever your business is ready for them.",
  },
  {
    icon: Star,
    title: "Founding Vendor badge on your profile",
    description:
      "Customers browsing Elbold see your Founding Vendor badge alongside your profile.",
  },
  {
    icon: TrendingUp,
    title: "Permanent top-of-page placement",
    description:
      "Your profile appears at the top of search results and category pages ahead of every vendor who joins after you.",
  },
  {
    icon: Shield,
    title: "Stripe-secured payments on every booking",
    description:
      "Every booking on Elbold goes through Stripe. Your payment is protected, released to you after completion, and covered by our dispute resolution process. You never chase invoices.",
  },
  {
    icon: Award,
    title: "Founding Vendor status. Permanent.",
    description:
      "Founding Vendor is not a time-limited promotion. It stays on your profile permanently, distinguishing you from the vendors who joined after the launch period closed.",
  },
];

const STEPS = [
  {
    n: "1",
    label: "Apply in five minutes",
    sub: "Business name, category, city, pricing. Nothing complicated.",
  },
  {
    n: "2",
    label: "We verify and activate you",
    sub: "Every vendor is reviewed before going live. Usually 24–48 hours.",
  },
  {
    n: "3",
    label: "Complete your profile",
    sub: "Add photos, packages and a bio. Better profiles receive more enquiries.",
  },
  {
    n: "4",
    label: "Start receiving enquiries",
    sub: "Customers searching in your category find your profile and contact you directly.",
  },
];

// Comparison table: Elbold vs social media vs other directories
const COMPARISON_ROWS = [
  {
    feature: "Free to join",
    elbold: true,
    social: true,
    directories: false,
    dirNote: "Most charge monthly",
  },
  {
    feature: "Customers actively searching to book",
    elbold: true,
    social: false,
    socialNote: "Followers ≠ buyers",
    directories: true,
  },
  {
    feature: "Payment protection on every booking",
    elbold: true,
    social: false,
    socialNote: "You chase invoices",
    directories: false,
    dirNote: "Varies by platform",
  },
  {
    feature: "Independently verified professionals only",
    elbold: true,
    social: false,
    socialNote: "Anyone can post",
    directories: false,
    dirNote: "Usually self-reported",
  },
  {
    feature: "Verified reviews from real bookings",
    elbold: true,
    social: false,
    socialNote: "Unverified testimonials",
    directories: false,
    dirNote: "Often unverified",
  },
  {
    feature: "Permanent priority placement",
    elbold: true,
    social: false,
    socialNote: "Algorithm-controlled",
    directories: false,
    dirNote: "Paid upgrades required",
  },
  {
    feature: "Founding Vendor badge",
    elbold: true,
    social: false,
    directories: false,
  },
  {
    feature: "Dispute resolution if something goes wrong",
    elbold: true,
    social: false,
    directories: false,
    dirNote: "Rare exceptions",
  },
  {
    feature: "Business analytics and revenue tracking",
    elbold: true,
    social: false,
    socialNote: "No business data",
    directories: false,
    dirNote: "Not available",
  },
  {
    feature: "Client CRM for off-platform contacts",
    elbold: true,
    social: false,
    socialNote: "DMs, not a system",
    directories: false,
    dirNote: "Not available",
  },
];

// Honest treatment of what a vendor already uses — not "replace everything,"
// per-tool, matching what Elbold can genuinely deliver today.
const ALREADY_USING = [
  {
    tool: "A CRM (Dubsado, HoneyBook, 17hats)",
    verdict: "Complements",
    body: "These have contracts and invoicing Elbold doesn't build yet. Keep it for that. Use Elbold for the marketplace profile, verified reviews and off-platform contact tracking it doesn't do.",
  },
  {
    tool: "A booking or scheduling tool",
    verdict: "Complements",
    body: "Your Elbold availability calendar protects you from a marketplace-driven double-booking. Run it alongside your existing scheduling tool, not instead of it.",
  },
  {
    tool: "A personal website",
    verdict: "Replaces",
    body: "Your Elbold page already does more than most self-built vendor websites — verified badges, structured reviews, SEO, a booking flow. It can be your only website.",
  },
  {
    tool: "Social media (Instagram, Facebook, TikTok)",
    verdict: "Complements",
    body: "Keep posting. Put your Elbold link in the bio — that's where a follower becomes a booking with a paper trail behind it.",
  },
  {
    tool: "WhatsApp for enquiries",
    verdict: "Complements",
    body: "Keep messaging there. Log the contact in your Elbold CRM so it doesn't disappear when the chat scrolls away.",
  },
  {
    tool: "A spreadsheet or paper diary",
    verdict: "Replaces",
    body: "This is exactly what the CRM is for. Your contact history stops depending on a notebook you could lose.",
  },
  {
    tool: "Another marketplace (Bark, Poptop, Hitched)",
    verdict: "Complements",
    body: "List on both — most vendors do. What Elbold offers that a lead marketplace can't: reviews that are structurally impossible to fake, because every one is gated to a real, confirmed booking.",
  },
];

async function getProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function FoundingVendorsPage() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-24 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-4xl mx-auto text-center pt-20">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-10 tracking-[0.2em] uppercase"
            style={{
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.25)",
              color: "rgba(201,168,76,0.8)",
            }}
          >
            <Award size={12} />
            Founding Vendor Programme
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
            Elbold connects event hosts with verified DJs, photographers, caterers,
            decorators and more across the UK. Build your reputation on a platform
            designed specifically for UK event professionals, receive enquiries from
            customers actively looking to book, and create your profile free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vendor/apply" className="btn-luxury">
              Apply Free. Takes 5 Minutes.
            </Link>
            <Link href="/browse" className="btn-luxury-outline">
              See the Marketplace
            </Link>
          </div>
          <p
            className="text-xs font-light mt-7"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            No credit card required. Free to start. Cancel
            anytime.
          </p>
        </div>
      </section>

      {/* ── WHY NOW — FOUNDING VENDOR STATUS ─────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p
                className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
                style={{ color: "#C9A84C" }}
              >
                Why Now
              </p>
              <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-5">
                Founding Vendor status.
                <br />
                Permanent.
              </h2>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
                Founding Vendor status exists because Elbold is building
                something that requires trust from both sides: customers and
                professionals. The vendors who join now help establish the
                platform standard, and in return receive permanent advantages
                that no later applicant can access.
              </p>
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <AlertCircle size={15} style={{ color: "#C9A84C", flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs font-light leading-relaxed" style={{ color: "rgba(11,31,77,0.6)" }}>
                  Customers searching for event professionals in your area will
                  see whichever vendors appear at the top of their results. Those
                  positions belong to whoever applied first.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "As a Founding Vendor",
                  items: [
                    "Founding Vendor badge on your profile. Permanent.",
                    "Permanent top placement in your category and city",
                    "First access to every new feature Elbold releases",
                    "Input into what gets built next",
                    "A profile that predates every vendor who joins after",
                  ],
                  positive: true,
                },
                {
                  title: "Standard Vendor",
                  items: [
                    "Standard placement, below all Founding Vendors",
                    "No founding badge",
                    "Features released to Founding Vendors first",
                    "Same quality review process, same platform",
                  ],
                  positive: false,
                },
              ].map(({ title, items, positive }) => (
                <div
                  key={title}
                  className="rounded-2xl p-6"
                  style={{
                    background: positive ? "#0B1F4D" : "white",
                    border: positive ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  <div
                    className="text-xs font-semibold tracking-wider uppercase mb-4"
                    style={{ color: positive ? "rgba(201,168,76,0.7)" : "#9ca3af" }}
                  >
                    {title}
                  </div>
                  <ul className="space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        {positive ? (
                          <CheckCircle2 size={13} style={{ color: "#C9A84C", flexShrink: 0, marginTop: 1 }} />
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: "#e5e7eb" }}
                          />
                        )}
                        <span
                          className="text-xs font-light leading-relaxed"
                          style={{ color: positive ? "rgba(255,255,255,0.75)" : "#6b7280" }}
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
              style={{ color: "#C9A84C" }}
            >
              Platform Comparison
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              Why Elbold, not Instagram or a directory?
            </h2>
            <p className="text-sm text-gray-400 font-light max-w-xl mx-auto">
              Most event professionals use social media and maybe one or two
              directories. Here is how they compare. Honestly.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th
                    className="text-left pb-5 pr-6 font-light text-gray-400 text-xs"
                    style={{ width: "40%" }}
                  />
                  <th className="pb-5 px-4 text-center">
                    <div
                      className="inline-flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl"
                      style={{ background: "#0B1F4D" }}
                    >
                      <span
                        className="text-xs font-bold tracking-widest"
                        style={{ color: "#D4AF37" }}
                      >
                        Elbold
                      </span>
                      <span
                        className="text-xs font-light"
                        style={{ color: "rgba(212,175,55,0.45)" }}
                      >
                        Founding Vendor
                      </span>
                    </div>
                  </th>
                  <th className="pb-5 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">Social Media</span>
                      <span className="text-xs font-light text-gray-300">Instagram / Facebook</span>
                    </div>
                  </th>
                  <th className="pb-5 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">Directories</span>
                      <span className="text-xs font-light text-gray-300">Bark, Poptop etc.</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(
                  ({ feature, elbold, social, socialNote, directories, dirNote }, i) => (
                    <tr
                      key={feature}
                      style={{
                        background: i % 2 === 0 ? "white" : "#fafafa",
                        borderTop: "1px solid #f3f4f6",
                      }}
                    >
                      <td className="py-4 pr-6 text-xs text-gray-600 font-light">{feature}</td>

                      {/* Elbold */}
                      <td className="py-4 px-4 text-center">
                        {elbold ? (
                          <div className="flex justify-center">
                            <CheckCircle2 size={16} style={{ color: "#0B1F4D" }} />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <X size={14} className="text-gray-300" />
                          </div>
                        )}
                      </td>

                      {/* Social */}
                      <td className="py-4 px-4 text-center">
                        {social ? (
                          <div className="flex justify-center">
                            <CheckCircle2 size={16} className="text-gray-400" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <X size={14} className="text-gray-300" />
                            {socialNote && (
                              <span className="text-xs text-gray-300 font-light">
                                {socialNote}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Directories */}
                      <td className="py-4 px-4 text-center">
                        {directories ? (
                          <div className="flex justify-center">
                            <CheckCircle2 size={16} className="text-gray-400" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <X size={14} className="text-gray-300" />
                            {dirNote && (
                              <span className="text-xs text-gray-300 font-light">
                                {dirNote}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-300 font-light mt-5 text-center">
            Comparison reflects typical platform policies. Individual platforms vary.
          </p>
        </div>
      </section>

      {/* ── ALREADY USING SOMETHING ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
              style={{ color: "#C9A84C" }}
            >
              Already Have a System?
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              You&apos;re not starting from nothing. Neither are we asking you to.
            </h2>
            <p className="text-sm text-gray-400 font-light max-w-xl mx-auto">
              Every vendor who joins Elbold already runs their business somehow. Here&apos;s an
              honest answer for each one — what stays, what Elbold adds.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {ALREADY_USING.map(({ tool, verdict, body }) => (
              <div
                key={tool}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{tool}</h3>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: verdict === "Replaces" ? "rgba(11,31,77,0.08)" : "rgba(201,168,76,0.1)",
                      color: verdict === "Replaces" ? "#0B1F4D" : "#0d1b3e",
                    }}
                  >
                    {verdict}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
              style={{ color: "#C9A84C" }}
            >
              What You Get
            </p>
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">
              What you get as a Founding Vendor
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light text-sm">
              Everything you need to be visible to early customers when Elbold launches, with
              placement advantages that stay with you permanently.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "#0d1b3e" }}
                >
                  <Icon size={20} style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY STAY ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
                Long-Term Value
              </p>
              <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-5">
                The longer you&apos;re on Elbold,<br />the more valuable your account becomes.
              </h2>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
                Every booking you complete builds your review history. Every client you manage through
                the CRM stays attached to your account. Every month of revenue data makes your
                analytics more meaningful.
              </p>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-7">
                When you leave a social media platform, you lose your followers. When you leave Elbold,
                you&apos;d lose your verified reviews, your booking history, your client relationships,
                and the placement advantage you built by joining early. All of which took real time to earn.
                That&apos;s not a lock-in tactic. That&apos;s what it means to run a real business on a real platform.
              </p>
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <TrendingUp size={15} style={{ color: "#C9A84C", flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs font-light leading-relaxed" style={{ color: "rgba(11,31,77,0.6)" }}>
                  Revenue analytics, lead funnel data, seasonal demand trends, and client CRM are
                  already live in the Vendor Dashboard, and growing every quarter.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Verified reviews",
                  sub: "Every review comes from a confirmed booking. They accumulate on your profile and cannot be replicated on any other platform.",
                },
                {
                  label: "Booking history and revenue analytics",
                  sub: "12-month revenue trends, month-over-month comparisons, average booking value, and payout tracking grow more useful over time.",
                },
                {
                  label: "Client CRM",
                  sub: "Instagram enquiries, WhatsApp leads, referrals and other off-platform contacts are logged and tracked. That relationship history stays yours.",
                },
                {
                  label: "Verified status",
                  sub: "Your verification level reflects documentation our team has reviewed. It communicates credibility that social media cannot replicate.",
                },
                {
                  label: "Permanent placement advantage",
                  sub: "Founding Vendors hold their priority placement permanently. No algorithm can demote you based on posting frequency or paid promotion.",
                },
              ].map(({ label, sub }) => (
                <div key={label} className="flex gap-3 rounded-xl p-5 border border-gray-100 bg-white">
                  <CheckCircle2 size={14} style={{ color: "#0B1F4D", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-0.5">{label}</div>
                    <div className="text-xs text-gray-400 font-light leading-relaxed">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT Elbold EXPECTS FROM YOU ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p
                className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
                style={{ color: "#C9A84C" }}
              >
                Vendor Standards
              </p>
              <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-5">
                We take our reputation seriously.
                <br />
                We expect you to as well.
              </h2>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">
                Elbold is a curated platform. We review every application, and we
                maintain standards after approval. That&apos;s what makes the
                verification badge meaningful, and what protects the platform
                for every vendor on it.
              </p>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-7">
                Our full Vendor Standards document is published and publicly
                available. We believe vendors should know exactly what we expect,
                and exactly what happens if standards are not met.
              </p>
              <Link
                href="/vendor-standards"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: "#0B1F4D" }}
              >
                Read the Vendor Standards <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Genuine portfolio",
                  desc: "Images and samples must represent your actual work. Not other vendors' work or stock photography.",
                },
                {
                  title: "Accurate pricing",
                  desc: "Prices listed on your profile should reflect what customers are actually charged when they book.",
                },
                {
                  title: "Professional response times",
                  desc: "Enquiries should be responded to within 48 hours. Customers who do not hear back are a bad experience for everyone.",
                },
                {
                  title: "Honour confirmed bookings",
                  desc: "Cancelling a confirmed booking has serious consequences for the customer. Elbold's dispute process will investigate any cancellation.",
                },
                {
                  title: "Treat every customer as a reference",
                  desc: "Reviews are from real bookings only. How you deliver will be visible to every future customer who views your profile.",
                },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl p-5 border border-gray-100"
                >
                  <CheckCircle2
                    size={14}
                    style={{ color: "#0B1F4D", flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-0.5">
                      {title}
                    </div>
                    <div className="text-xs text-gray-400 font-light leading-relaxed">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase"
              style={{ color: "#C9A84C" }}
            >
              The Process
            </p>
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">
              From application to first enquiry
            </h2>
            <p className="text-gray-400 font-light text-sm">
              Four steps. Free throughout. No commitment required.
            </p>
          </div>
          <div className="space-y-6">
            {STEPS.map(({ n, label, sub }) => (
              <div
                key={n}
                className="flex items-start gap-5 bg-white border border-gray-100 rounded-2xl p-6"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "#0d1b3e" }}
                >
                  {n}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500 mt-0.5 font-light">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ────────────────────────────────────────────────── */}
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
              <h3 className="font-semibold text-gray-900 text-sm mb-2">
                Every vendor is reviewed
              </h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                We individually verify every vendor before they appear on the
                platform. Customers know that means something.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#0D1B3E" }}
              >
                <Shield size={18} style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">
                Payments through Stripe
              </h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Every booking is paid through Stripe. Your earnings are protected
                and released to you after the event completes.
              </p>
            </div>

            <div className="text-center p-6 border border-gray-100 rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#0D1B3E" }}
              >
                <Award size={18} style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">
                No lock-in
              </h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Your profile is free. There is no contract and no minimum term.
                If Elbold does not work for your business, you can leave at any
                time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.55)" }}
          >
            Applications open now
          </p>
          <h2
            className="text-3xl font-light tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Start receiving booking enquiries.
          </h2>
          <p
            className="font-light mb-10 leading-relaxed max-w-md mx-auto text-sm"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Apply in under 5 minutes. We review within 24–48 hours. Your profile
            goes live immediately upon approval.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vendor/apply" className="btn-luxury">
              Apply Now. It&apos;s Free.
            </Link>
            <Link href="/vendor-standards" className="btn-luxury-outline">
              Read Our Standards
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              href="/vendor-faq"
              className="text-xs font-light transition-opacity hover:opacity-70 flex items-center gap-1"
              style={{ color: "rgba(201,168,76,0.5)" }}
            >
              Read the Vendor FAQ <ArrowRight size={10} />
            </Link>
          </div>
          <p
            className="text-xs font-light mt-6"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            No credit card &nbsp;·&nbsp; Free to start &nbsp;·&nbsp; A real business dashboard from day one
            &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
