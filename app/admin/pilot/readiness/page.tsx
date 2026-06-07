import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { Profile } from "@/types";
import {
  CheckCircle2, AlertCircle, XCircle, ArrowLeft, Shield,
  Wallet, Scale, Users, Star, CreditCard, Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

type RiskLevel = "resolved" | "low" | "medium" | "high";

interface RiskItem {
  area: string;
  finding: string;
  risk: RiskLevel;
  mitigation: string;
}

const VERDICT = "GO WITH CAUTION" as const;

const COMPLETED_ITEMS = [
  { label: "Payment flow end-to-end (Stripe → webhook → booking confirmed)", category: "Payments" },
  { label: "Booking status correctly sequenced: pending_payment → confirmed", category: "Payments" },
  { label: "Payment success page shows booking context (vendor, event, date)", category: "Payments" },
  { label: "Deposit held by Stripe; vendor receives payout within 7 working days post-event", category: "Payments" },
  { label: "Refund policy consistent across /booking-protection, /help, and /support", category: "Payments" },
  { label: "Quote expiry enforced at API level before booking creation", category: "Quotes" },
  { label: "Vendor notified quote accepted (awaiting payment, not confirmed)", category: "Quotes" },
  { label: "Vendor application 2 working-day SLA committed in email and UI", category: "Vendors" },
  { label: "Vendor payout timeline disclosed in terms and payment notification", category: "Vendors" },
  { label: "Vendor lifecycle timeline visible during onboarding (5-stage progress)", category: "Vendors" },
  { label: "All fabricated claims removed (no Written Contracts, no unsubstantiated guarantees)", category: "Trust" },
  { label: "Review system: only confirmed bookings eligible; one review per booking", category: "Reviews" },
  { label: "Review automation: email + in-app notification 3 days post-event", category: "Reviews" },
  { label: "Admin payout queue: mark-as-paid, audit trail, vendor notification", category: "Operations" },
  { label: "Admin disputes workflow: open/investigating/resolved with timeline", category: "Operations" },
  { label: "Admin operations command centre: unified action queue with live counts", category: "Operations" },
  { label: "Customer support centre: 6 FAQ sections, 4 email channels, SLAs", category: "Operations" },
  { label: "StatusBadge handles pending_payment status", category: "UI/UX" },
  { label: "Customer booking detail shows Pay button for pending_payment bookings", category: "UI/UX" },
  { label: "Vendor bookings list includes pending_payment as a filter tab", category: "UI/UX" },
  { label: "Trust audit dashboard: 8 trust pillars with live scores", category: "Trust" },
  { label: "Booking Protection page: accurate 100% refund policy for vendor cancellations", category: "Trust" },
  // Real World Validation Sprint — June 2026
  { label: "Customer email sent on quote acceptance: deposit payment prompt with booking link", category: "Emails" },
  { label: "Customer in-app notification sent on quote acceptance: Pay Deposit to Confirm", category: "Emails" },
  { label: "OG social image reference corrected — no 404 on social media shares", category: "SEO" },
  { label: "Sitemap includes all trust/content pages: /about, /why-elbold, /how-we-verify, /guides, /support, /help", category: "SEO" },
  { label: "All 5 guide pages indexed in sitemap with correct priority/changeFrequency", category: "SEO" },
  { label: "robots.txt: all public pages allowed; dashboard/vendor/admin/api paths blocked", category: "SEO" },
  { label: "Guide pages: Article + FAQPage + BreadcrumbList JSON-LD schema on all 5 articles", category: "SEO" },
  { label: "Vendor profiles: LocalBusiness JSON-LD schema present on all profile pages", category: "SEO" },
  { label: "Homepage: Organization + WebSite JSON-LD schema with UK service area", category: "SEO" },
];

const RISK_REGISTER: RiskItem[] = [
  {
    area: "Payout Operations",
    finding: "Payouts are fully manual — founder must transfer to each vendor via bank within 7 working days of event completion",
    risk: "medium",
    mitigation: "Admin payout queue is live. Set a calendar reminder for event.date + 7 working days for every confirmed booking. At 20 vendors this is manageable. At 100 vendors, Stripe Connect becomes required.",
  },
  {
    area: "Stripe Webhook Reliability",
    finding: "Payment confirmation is 100% dependent on webhook delivery. If the webhook fails silently, booking stays as pending_payment indefinitely",
    risk: "medium",
    mitigation: "Stripe automatically retries failed webhooks for 72 hours. Monitor Stripe dashboard for failed webhook events during pilot. Consider adding a cron check for pending_payment bookings older than 2 hours that have a completed Stripe session.",
  },
  {
    area: "Review Volume",
    finding: "Zero reviews on the platform at pilot launch. Vendor profiles show no trust signal from review history",
    risk: "medium",
    mitigation: "Pilot vendors should be briefed that reviews will start appearing after their first completed events. Trust programme (Why ELBOLD, Verification badges) compensates for this in the interim.",
  },
  {
    area: "Email Deliverability",
    finding: "All transactional emails (booking confirmation, quote accepted, review request) are sent via Resend from noreply@elbold.com. Domain may not be verified with DMARC/DKIM at launch",
    risk: "high",
    mitigation: "Verify noreply@elbold.com in Resend before sending first email. Set up DMARC/DKIM/SPF records for elbold.com. Without these, emails will land in spam and the entire customer experience breaks.",
  },
  {
    area: "Vendor Verification",
    finding: "Verification is manual. No automated identity check or document review system exists",
    risk: "low",
    mitigation: "At 20 vendors, manual review is the correct approach. The admin /verifications queue is live. Document the verification standard before approving first vendor.",
  },
  {
    area: "Customer Disputes",
    finding: "Dispute resolution is manual admin decision. No SLA commitment exists to customers for dispute resolution time",
    risk: "low",
    mitigation: "Admin disputes page is live with full workflow. /support page and /booking-protection commit to 5 business days for dispute resolution. This is sufficient for pilot scale.",
  },
  {
    area: "Data & Privacy",
    finding: "No privacy policy or cookie notice visible on the marketing site at time of audit",
    risk: "high",
    mitigation: "A privacy policy is required before collecting any customer data (even for signups). Create a /privacy page and /cookies page before first external user. Link in the footer.",
  },
  {
    area: "Vendor Payout Verification",
    finding: "Vendor bank details are collected in-app but there is no verification that the account belongs to the vendor's business. Risk of misdirected payout.",
    risk: "medium",
    mitigation: "During pilot, verify bank details manually via a call or document before first payout. Add a confirmation step in the payout process ('Confirm you are paying: [masked account]').",
  },
  {
    area: "No-show & Late Cancellation",
    finding: "If a vendor cancels last-minute or does not show up, the process exists in policy but has not been stress-tested operationally",
    risk: "low",
    mitigation: "urgent@elbold.com is monitored. Refund process exists via Stripe. For pilot, maintain the founder's phone number as a backup contact for events in the next 7 days.",
  },
];

const FOUNDER_CHECKLIST = [
  {
    category: "Before Inviting First Vendor",
    items: [
      "Verify noreply@elbold.com email domain in Resend (DKIM/SPF/DMARC)",
      "Create /privacy and /cookies pages — link in footer",
      "Set ADMIN_EMAILS environment variable on production Vercel",
      "Set CRON_SECRET and configure the reminder cron job on Vercel",
      "Set STRIPE_WEBHOOK_SECRET to the production webhook endpoint",
      "Test end-to-end: create event → request quote → accept → pay → confirm",
      "Define your vendor verification standard (what documents do you require?)",
    ],
  },
  {
    category: "First 10 Vendors",
    items: [
      "Verify each vendor manually before approving — use /admin/vendors",
      "Call each vendor after approval to walk them through the quote flow",
      "Check /admin/operations daily — action queue should be clear",
      "For each payout due: confirm bank details before transfer",
      "Monitor Stripe dashboard for failed webhook events",
    ],
  },
  {
    category: "First 20 Vendors",
    items: [
      "Review first 5 completed bookings — was the experience smooth?",
      "Check review automation — did review emails send 3 days post-event?",
      "Check /admin/payouts — all payouts processed within 7 working days?",
      "Interview 2-3 customers and 2-3 vendors about their experience",
      "Update this readiness report with findings",
    ],
  },
  {
    category: "At 20 Vendors — Reassess",
    items: [
      "Does the payout queue require Stripe Connect automation?",
      "Has any dispute arisen — how was it resolved?",
      "Are review numbers sufficient to build trust for new customers?",
      "Is the quote response SLA being met by vendors (48 hours)?",
      "Is the cron job running reliably on Vercel?",
    ],
  },
];

export default async function PilotReadinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const adminProfile: Profile = {
    id: user.id,
    email: user.email ?? "",
    role: "admin",
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    phone_verified: profile?.phone_verified ?? false,
    avatar_url: profile?.avatar_url ?? null,
    created_at: profile?.created_at ?? new Date().toISOString(),
  };

  const high   = RISK_REGISTER.filter((r) => r.risk === "high");
  const medium = RISK_REGISTER.filter((r) => r.risk === "medium");
  const low    = RISK_REGISTER.filter((r) => r.risk === "low");

  const riskColor: Record<RiskLevel, string> = {
    resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    low:      "text-sky-400 bg-sky-500/10 border-sky-500/20",
    medium:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
    high:     "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <DashboardLayout user={adminProfile}>
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/pilot" className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs">
                <ArrowLeft size={12} /> Pilot Ops
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-white">Pilot Readiness Report</h1>
            <p className="text-slate-400 text-sm mt-1">20-Vendor Pilot — Essex, Kent, London · Produced {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <Link href="/admin" className="btn-secondary text-sm py-2">← Admin</Link>
        </div>

        {/* Verdict banner */}
        <div className="bg-amber-500/8 border border-amber-500/30 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
              <AlertCircle size={28} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-amber-500/60 font-semibold uppercase tracking-widest">Overall Verdict</p>
              <p className="text-3xl font-bold text-amber-400">{VERDICT}</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            ELBOLD is operationally ready for a controlled 20-vendor pilot. All payment, booking, trust,
            email, and SEO infrastructure is functional. Two high-priority items — email domain
            deliverability verification (DKIM/SPF/DMARC) and a privacy policy — must be resolved before
            inviting the first external user. All other risks are manageable at pilot scale.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{high.length}</p>
              <p className="text-xs text-slate-500">High Risk</p>
              <p className="text-xs text-red-400/70 mt-1">Must fix before launch</p>
            </div>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{medium.length}</p>
              <p className="text-xs text-slate-500">Medium Risk</p>
              <p className="text-xs text-amber-400/70 mt-1">Manage with process</p>
            </div>
            <div className="bg-sky-500/8 border border-sky-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-sky-400">{low.length}</p>
              <p className="text-xs text-slate-500">Low Risk</p>
              <p className="text-xs text-sky-400/70 mt-1">Monitor and iterate</p>
            </div>
          </div>
        </div>

        {/* What's complete */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <h2 className="text-base font-bold text-white">Sprint Deliverables — Complete</h2>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {COMPLETED_ITEMS.length} items
            </span>
          </div>
          <div className="grid gap-2">
            {(["Payments", "Quotes", "Vendors", "Trust", "Reviews", "Operations", "UI/UX", "Emails", "SEO"] as const).map((cat) => {
              const items = COMPLETED_ITEMS.filter((i) => i.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="bg-white/3 border border-white/6 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-white/3 border-b border-white/6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cat}</p>
                  </div>
                  <div className="divide-y divide-white/4">
                    {items.map((item) => (
                      <div key={item.label} className="flex items-start gap-3 px-4 py-3">
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-300 leading-relaxed">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk register */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-slate-400" />
            <h2 className="text-base font-bold text-white">Risk Register</h2>
          </div>

          {[
            { items: high,   label: "High Risk — Fix Before Launch",         icon: XCircle,     iconColor: "text-red-400" },
            { items: medium, label: "Medium Risk — Manage With Process",      icon: AlertCircle, iconColor: "text-amber-400" },
            { items: low,    label: "Low Risk — Monitor During Pilot",        icon: AlertCircle, iconColor: "text-sky-400" },
          ].map(({ items, label, icon: Icon, iconColor }) => (
            <div key={label} className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={13} className={iconColor} />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              </div>
              <div className="space-y-3">
                {items.map((r) => (
                  <div key={r.area} className="bg-white/3 border border-white/6 rounded-xl overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${riskColor[r.risk]}`}>
                        {r.risk.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white mb-1">{r.area}</p>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">{r.finding}</p>
                        <div className="bg-white/3 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Mitigation</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{r.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Founder checklist */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-brand-400" />
            <h2 className="text-base font-bold text-white">Founder Operations Checklist</h2>
          </div>
          <div className="space-y-4">
            {FOUNDER_CHECKLIST.map((section) => (
              <div key={section.category} className="bg-white/3 border border-white/6 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-white/3 border-b border-white/6">
                  <p className="text-sm font-semibold text-white">{section.category}</p>
                </div>
                <div className="divide-y divide-white/4">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="w-4 h-4 rounded border border-white/15 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scale thresholds */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-slate-400" />
            <h2 className="text-base font-bold text-white">When to Upgrade Your Infrastructure</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                milestone: "20 Vendors",
                verdict: "Current Setup",
                color: "text-emerald-400",
                bg: "bg-emerald-500/8 border-emerald-500/20",
                items: ["Manual payout via bank", "Manual vendor verification", "Founder handles all disputes", "Email via Resend free tier"],
              },
              {
                milestone: "100 Vendors",
                verdict: "Needs Investment",
                color: "text-amber-400",
                bg: "bg-amber-500/8 border-amber-500/20",
                items: ["Stripe Connect for automated payouts", "ID verification API (Persona/Stripe Identity)", "Dedicated support hire or tool (Intercom)", "Email warm-up + dedicated sending IP"],
              },
              {
                milestone: "500 Vendors",
                verdict: "Requires Platform",
                color: "text-red-400",
                bg: "bg-red-500/8 border-red-500/20",
                items: ["Automated dispute workflow with SLA tracking", "Vendor insurance verification", "Finance tool (Xero integration for payout accounting)", "Admin team: support, trust, finance"],
              },
            ].map(({ milestone, verdict, color, bg, items }) => (
              <div key={milestone} className={`border rounded-xl p-5 ${bg}`}>
                <p className={`text-lg font-bold ${color}`}>{milestone}</p>
                <p className="text-xs text-slate-500 mb-4">{verdict}</p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links to operational tools */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Operational Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: "/admin/operations",         label: "Operations Command",  icon: Activity },
              { href: "/admin/payouts",             label: "Payout Queue",        icon: Wallet },
              { href: "/admin/disputes",            label: "Disputes",            icon: Scale },
              { href: "/admin/vendors?status=pending", label: "Vendor Approvals", icon: Users },
              { href: "/admin/launch",              label: "Launch Checklist",    icon: CheckCircle2 },
              { href: "/admin/reviews",             label: "Review Moderation",   icon: Star },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3.5 bg-white/4 border border-white/6 rounded-xl hover:border-white/10 transition-colors">
                <Icon size={14} className="text-brand-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
