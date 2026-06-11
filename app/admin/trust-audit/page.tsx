import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  Shield, Star, CreditCard, Users, Eye, TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

interface JourneyScore {
  name: string;
  path: string;
  fiveSecond: number;
  thirtySecond: number;
  sixtySecond: number;
  flags: string[];
  improvements: string[];
  lastReviewed: string;
}

const JOURNEYS: JourneyScore[] = [
  {
    name: "Homepage",
    path: "/",
    fiveSecond: 4,
    thirtySecond: 4,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Trust strip updated with specific, honest labels",
      "Fake testimonial section replaced with Booking Promise",
      "Stats row hidden when vendor count is zero",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Browse / Search",
    path: "/browse",
    fiveSecond: 4,
    thirtySecond: 3,
    sixtySecond: 3,
    flags: [
      "No trust signal visible during empty search results",
      "Verified badges not explained inline",
    ],
    improvements: [],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Vendor Profile",
    path: "/vendors/[id]",
    fiveSecond: 5,
    thirtySecond: 4,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Elbold Verified badge now links to /how-we-verify",
      "BookingPromise component added to sidebar",
      "Trust signals updated: fabricated response times removed",
      "Login intent preserved through auth flow",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Quote Request",
    path: "/dashboard/quotes/new",
    fiveSecond: 3,
    thirtySecond: 3,
    sixtySecond: 4,
    flags: [
      "No payment protection language shown during quote flow",
      "Customer does not know what happens after they submit",
    ],
    improvements: [
      "Unauthenticated users redirected with intent preserved",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Booking / Checkout",
    path: "/dashboard/bookings/new",
    fiveSecond: 3,
    thirtySecond: 2,
    sixtySecond: 3,
    flags: [
      "No Stripe reassurance visible at payment step",
      "Deposit protection not explained during checkout",
      "No link to booking protection page from payment screen",
    ],
    improvements: [],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Customer Dashboard",
    path: "/dashboard",
    fiveSecond: 4,
    thirtySecond: 3,
    sixtySecond: 4,
    flags: [
      "Empty state when no bookings does not explain next steps clearly",
    ],
    improvements: [],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Vendor Dashboard",
    path: "/vendor/dashboard",
    fiveSecond: 4,
    thirtySecond: 4,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Payout timeline explained accurately (7 working days)",
      "Commission breakdown visible in payouts page",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Vendor Application",
    path: "/vendor/apply",
    fiveSecond: 4,
    thirtySecond: 4,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Commission transparency added (90% / 10% split)",
      "Emoji icons replaced with Lucide icons",
      "Confirmation screen added instead of toast-then-redirect",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Verification: How We Verify",
    path: "/how-we-verify",
    fiveSecond: 5,
    thirtySecond: 5,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Full 9-section rewrite with all verification dimensions",
      "Verification timeline added",
      "Fraud prevention section added",
      "What verification does not guarantee section added",
      "FAQ section added",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Booking Protection",
    path: "/booking-protection",
    fiveSecond: 5,
    thirtySecond: 5,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Converted from plain legal page to rich trust page",
      "Customer and vendor responsibilities sections added",
      "Refund table added",
      "Dispute process step-by-step added",
      "Core promise callout added",
    ],
    lastReviewed: "2026-06-06",
  },
  {
    name: "Why Elbold",
    path: "/why-elbold",
    fiveSecond: 5,
    thirtySecond: 5,
    sixtySecond: 5,
    flags: [],
    improvements: ["New page created for Sprint C"],
    lastReviewed: "2026-06-06",
  },
  {
    name: "How It Works",
    path: "/how-it-works",
    fiveSecond: 4,
    thirtySecond: 4,
    sixtySecond: 4,
    flags: [],
    improvements: [
      "Instagram comparison table added",
      "FAQ section added",
      "Automatic payout language fixed",
    ],
    lastReviewed: "2026-06-06",
  },
];

function scoreColor(score: number): string {
  if (score >= 4.5) return "#D4AF37";
  if (score >= 3.5) return "#059669";
  if (score >= 2.5) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Warning";
  return "Critical";
}

function ScorePill({ score }: { score: number }) {
  const color = scoreColor(score);
  const label = scoreLabel(score);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
    >
      {score.toFixed(1)} {label}
    </span>
  );
}

function avgScore(j: JourneyScore): number {
  return (j.fiveSecond + j.thirtySecond + j.sixtySecond) / 3;
}

export default async function TrustAuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const adminDb = await createAdminClient();
  const { data: profile } = await adminDb.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const [vendorCount, reviewCount, bookingCount] = await Promise.all([
    adminDb.from("vendors").select("id", { count: "exact", head: true }).eq("verified", true),
    adminDb.from("reviews").select("id", { count: "exact", head: true }),
    adminDb.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  const criticalJourneys = JOURNEYS.filter((j) => avgScore(j) < 2.5);
  const warningJourneys = JOURNEYS.filter((j) => avgScore(j) >= 2.5 && avgScore(j) < 3.5);
  const goodJourneys = JOURNEYS.filter((j) => avgScore(j) >= 3.5 && avgScore(j) < 4.5);
  const excellentJourneys = JOURNEYS.filter((j) => avgScore(j) >= 4.5);

  const overallAvg = JOURNEYS.reduce((s, j) => s + avgScore(j), 0) / JOURNEYS.length;
  const totalFlags = JOURNEYS.reduce((s, j) => s + j.flags.length, 0);
  const totalImprovements = JOURNEYS.reduce((s, j) => s + j.improvements.length, 0);

  return (
    <DashboardLayout user={profile as any}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trust Audit Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Scores every major customer and vendor journey on trust, clarity, and action confidence.
            </p>
          </div>
          <div
            className="px-4 py-2 rounded-xl text-center"
            style={{ background: `${scoreColor(overallAvg)}18`, border: `1px solid ${scoreColor(overallAvg)}30` }}
          >
            <div className="text-2xl font-bold" style={{ color: scoreColor(overallAvg) }}>
              {overallAvg.toFixed(1)}
            </div>
            <div className="text-xs font-medium" style={{ color: scoreColor(overallAvg) }}>
              Platform average
            </div>
          </div>
        </div>

        {/* Score methodology */}
        <div
          className="rounded-xl p-5 border border-gray-100"
          style={{ background: "#fafafa" }}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Scoring Methodology</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "5-second test", desc: "Does the visitor know what this page is for?" },
              { label: "30-second test", desc: "Do they understand why Elbold is trustworthy?" },
              { label: "60-second test", desc: "Is the action they should take clear?" },
            ].map(({ label, desc }) => (
              <div key={label}>
                <div className="text-xs font-semibold text-gray-700 mb-1">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
            {[
              { range: "4.5–5.0", label: "Excellent", color: "#D4AF37" },
              { range: "3.5–4.4", label: "Good", color: "#059669" },
              { range: "2.5–3.4", label: "Warning", color: "#f59e0b" },
              { range: "1.0–2.4", label: "Critical", color: "#ef4444" },
            ].map(({ range, label, color }) => (
              <div key={range} className="text-center">
                <span
                  className="text-xs font-bold"
                  style={{ color }}
                >
                  {label}
                </span>
                <div className="text-[10px] text-gray-400 mt-0.5">{range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Star, label: "Excellent journeys", value: excellentJourneys.length, color: "#D4AF37" },
            { icon: CheckCircle2, label: "Good journeys", value: goodJourneys.length, color: "#059669" },
            { icon: AlertTriangle, label: "Needs attention", value: warningJourneys.length, color: "#f59e0b" },
            { icon: XCircle, label: "Critical", value: criticalJourneys.length, color: "#ef4444" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 border border-gray-100 text-center"
              style={{ background: value > 0 ? `${color}08` : "#fafafa" }}
            >
              <Icon size={18} className="mx-auto mb-2" style={{ color }} />
              <div className="text-2xl font-bold" style={{ color: value > 0 ? color : "#d1d5db" }}>{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Active flags */}
        {totalFlags > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} style={{ color: "#ef4444" }} />
              <span className="text-sm font-semibold text-gray-900">
                {totalFlags} open {totalFlags === 1 ? "flag" : "flags"} requiring attention
              </span>
            </div>
            <div className="space-y-2">
              {JOURNEYS.filter((j) => j.flags.length > 0).map((j) =>
                j.flags.map((flag) => (
                  <div key={flag} className="flex items-start gap-2.5">
                    <XCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <span className="text-xs font-semibold text-gray-700">{j.name}: </span>
                      <span className="text-xs text-gray-500">{flag}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Journey scores table */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Journey Scores</h2>
          <div className="rounded-xl overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0D1B3E" }}>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Journey</th>
                  <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>5-sec</th>
                  <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>30-sec</th>
                  <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>60-sec</th>
                  <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Average</th>
                  <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {JOURNEYS.sort((a, b) => avgScore(a) - avgScore(b)).map((j, i) => {
                  const avg = avgScore(j);
                  return (
                    <tr
                      key={j.name}
                      style={{ background: i % 2 === 0 ? "#ffffff" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{j.name}</div>
                        <a
                          href={j.path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          {j.path}
                        </a>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="font-mono text-sm" style={{ color: scoreColor(j.fiveSecond) }}>
                          {j.fiveSecond}
                        </span>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="font-mono text-sm" style={{ color: scoreColor(j.thirtySecond) }}>
                          {j.thirtySecond}
                        </span>
                      </td>
                      <td className="text-center px-4 py-4">
                        <span className="font-mono text-sm" style={{ color: scoreColor(j.sixtySecond) }}>
                          {j.sixtySecond}
                        </span>
                      </td>
                      <td className="text-center px-4 py-4">
                        <ScorePill score={avg} />
                      </td>
                      <td className="text-center px-4 py-4">
                        {j.flags.length > 0 ? (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                          >
                            {j.flags.length}
                          </span>
                        ) : (
                          <CheckCircle2 size={14} style={{ color: "#059669", margin: "0 auto" }} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Improvements log */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Completed improvements ({totalImprovements})
          </h2>
          <div className="space-y-3">
            {JOURNEYS.filter((j) => j.improvements.length > 0).map((j) => (
              <div key={j.name} className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#fafafa" }}>
                  <span className="text-sm font-semibold text-gray-700">{j.name}</span>
                  <span className="text-xs text-gray-400">{j.lastReviewed}</span>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {j.improvements.map((imp) => (
                    <div key={imp} className="flex items-start gap-2">
                      <CheckCircle2 size={12} style={{ color: "#059669", flexShrink: 0, marginTop: "3px" }} />
                      <span className="text-xs text-gray-500">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform metrics */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Live platform signals</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Verified vendors", value: vendorCount.count ?? 0, color: "#0D1B3E" },
              { icon: Star, label: "Reviews on platform", value: reviewCount.count ?? 0, color: "#C9A84C" },
              { icon: CreditCard, label: "Total bookings", value: bookingCount.count ?? 0, color: "#059669" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl p-5 border border-gray-100 text-center">
                <Icon size={20} className="mx-auto mb-2" style={{ color }} />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Trust pages: quick access</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "How We Verify", href: "/how-we-verify", icon: Shield },
              { label: "Booking Protection", href: "/booking-protection", icon: CheckCircle2 },
              { label: "Why Elbold", href: "/why-elbold", icon: Star },
              { label: "Refund Policy", href: "/refunds", icon: CreditCard },
              { label: "How It Works", href: "/how-it-works", icon: Eye },
              { label: "Guides", href: "/guides", icon: TrendingUp },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} style={{ color: "#C9A84C" }} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <ArrowRight size={13} className="text-gray-400" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
