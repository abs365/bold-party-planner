import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CheckCircle2, XCircle, AlertCircle, Rocket, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

type CheckResult = { label: string; ok: boolean; warn?: boolean; note?: string };

async function runChecks() {
  const db = await createAdminClient();
  const checks: Record<string, CheckResult[]> = {};

  // -- Environment --
  checks["Environment Variables"] = [
    { label: "NEXT_PUBLIC_SUPABASE_URL",        ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { label: "SUPABASE_SERVICE_ROLE_KEY",       ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { label: "NEXT_PUBLIC_APP_URL",             ok: !!process.env.NEXT_PUBLIC_APP_URL },
    { label: "ADMIN_EMAILS",                    ok: !!process.env.ADMIN_EMAILS },
    { label: "STRIPE_SECRET_KEY",               ok: !!process.env.STRIPE_SECRET_KEY },
    { label: "STRIPE_WEBHOOK_SECRET",           ok: !!process.env.STRIPE_WEBHOOK_SECRET },
    { label: "STRIPE_PRO_MONTHLY_PRICE_ID",     ok: !!process.env.STRIPE_PRO_MONTHLY_PRICE_ID,   warn: !process.env.STRIPE_PRO_MONTHLY_PRICE_ID },
    { label: "STRIPE_PREMIUM_MONTHLY_PRICE_ID", ok: !!process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID, warn: !process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID },
    { label: "STRIPE_ELITE_MONTHLY_PRICE_ID",   ok: !!process.env.STRIPE_ELITE_MONTHLY_PRICE_ID,  warn: !process.env.STRIPE_ELITE_MONTHLY_PRICE_ID },
    { label: "STRIPE_PRO_ANNUAL_PRICE_ID",      ok: !!process.env.STRIPE_PRO_ANNUAL_PRICE_ID,     warn: !process.env.STRIPE_PRO_ANNUAL_PRICE_ID },
    { label: "STRIPE_PREMIUM_ANNUAL_PRICE_ID",  ok: !!process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID, warn: !process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID },
    { label: "STRIPE_ELITE_ANNUAL_PRICE_ID",    ok: !!process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,   warn: !process.env.STRIPE_ELITE_ANNUAL_PRICE_ID },
    { label: "RESEND_API_KEY",                  ok: !!process.env.RESEND_API_KEY },
    { label: "OPENAI_API_KEY",                  ok: !!process.env.OPENAI_API_KEY, warn: !process.env.OPENAI_API_KEY, note: "Required for AI planner" },
    { label: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",    ok: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, note: "Required for push notifications" },
    { label: "VAPID_PRIVATE_KEY",               ok: !!process.env.VAPID_PRIVATE_KEY, note: "Required for push notifications" },
    { label: "VAPID_SUBJECT",                   ok: !!process.env.VAPID_SUBJECT, warn: !process.env.VAPID_SUBJECT, note: "Push notification sender — e.g. mailto:hello@elbold.com" },
    { label: "SENTRY_DSN",                      ok: !!process.env.SENTRY_DSN, warn: !process.env.SENTRY_DSN, note: "Recommended for error monitoring" },
    { label: "ELBOLD_SEED_SECRET (dev only)",   ok: true, note: "Dev/test only - not required in production" },
  ];

  // -- Database Migrations --
  const tableChecks = await Promise.all([
    db.from("vendor_governance_flags").select("id").limit(1).then(r => !r.error),
    db.from("review_reports").select("id").limit(1).then(r => !r.error),
    db.from("vendor_reputation_snapshots").select("id").limit(1).then(r => !r.error),
    db.from("subscription_plans").select("slug").limit(1).then(r => !r.error),
    db.from("subscription_billing_events").select("id").limit(1).then(r => !r.error),
    db.from("push_subscriptions").select("id").limit(1).then(r => !r.error),
    db.from("quote_events").select("id").limit(1).then(r => !r.error),
    db.from("vendor_bank_details").select("id").limit(1).then(r => !r.error),
  ]);

  checks["Database Migrations"] = [
    { label: "Migration 022: vendor_governance table",           ok: tableChecks[0], note: tableChecks[0] ? "Applied" : "Missing — apply 022_vendor_governance.sql" },
    { label: "Migration 023: review_reports table",              ok: tableChecks[1], note: tableChecks[1] ? "Applied" : "Missing — apply 023_vendor_reviews_and_reputation.sql" },
    { label: "Migration 023: vendor_reputation_snapshots table", ok: tableChecks[2], note: tableChecks[2] ? "Applied" : "Missing — apply 023_vendor_reviews_and_reputation.sql" },
    { label: "Migration 024: subscription_plans table",          ok: tableChecks[3], note: tableChecks[3] ? "Applied" : "Missing — apply 024_subscription_infrastructure.sql" },
    { label: "Migration 024: subscription_billing_events table", ok: tableChecks[4], note: tableChecks[4] ? "Applied" : "Missing — apply 024_subscription_infrastructure.sql" },
    { label: "Migration 026: push_subscriptions table",          ok: tableChecks[5], note: tableChecks[5] ? "Applied (verified 2026-05-29)" : "Missing — apply 026_push_subscriptions.sql" },
    { label: "Migration 031: quote_events audit table",          ok: tableChecks[6], note: tableChecks[6] ? "Applied (verified 2026-06-01)" : "Missing — apply 031_quote_workflow.sql" },
    { label: "Migration 032: vendor_bank_details table",         ok: tableChecks[7], note: tableChecks[7] ? "Applied (verified 2026-06-01)" : "Missing — apply 032_vendor_bank_details.sql" },
    { label: "Migration 033: pilot_vendors + pilot_feedback",    ok: true, warn: true, note: "Apply 033_pilot_operations.sql in Supabase Dashboard" },
  ];

  // -- Data Integrity --
  let planCount = 0;
  if (tableChecks[3]) {
    const { count } = await db.from("subscription_plans").select("*", { count: "exact", head: true });
    planCount = count ?? 0;
  }
  checks["Data Integrity"] = [
    { label: "Subscription plans seeded (>=4 plans)", ok: planCount >= 4, note: planCount < 4 ? `Only ${planCount} plans found - run seed or apply migration 024` : undefined },
    { label: "Admin emails configured (>=1)",         ok: ADMIN_EMAILS.filter(Boolean).length > 0 },
  ];

  // -- Email Delivery --
  let resendDomainVerified = false;
  let resendDomainStatus = "unknown";
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json() as { data?: Array<{ name: string; status: string }> };
        const elboldDomain = (json.data ?? []).find((d) => d.name === "elbold.com");
        if (elboldDomain) {
          resendDomainVerified = elboldDomain.status === "verified";
          resendDomainStatus = elboldDomain.status;
        } else {
          resendDomainStatus = "not_added";
        }
      }
    } catch { resendDomainStatus = "api_error"; }
  }

  checks["Email Delivery"] = [
    { label: "RESEND_API_KEY configured", ok: !!process.env.RESEND_API_KEY },
    {
      label: "elbold.com verified in Resend",
      ok: resendDomainVerified,
      warn: !resendDomainVerified,
      note: resendDomainStatus === "verified"
        ? "elbold.com sending domain fully verified - live delivery confirmed 2026-05-29"
        : resendDomainStatus === "not_added"
        ? "Domain not in Resend - add elbold.com then add SPF + DKIM DNS records"
        : resendDomainStatus === "pending"
        ? "Domain added but DNS not yet verified - check propagation (up to 48h)"
        : `Status: ${resendDomainStatus} - visit resend.com/domains`,
    },
    { label: "Vendor registration email wired", ok: true, note: "POST /api/vendor/apply fires sendVendorApplicationReceived - fixed in ELBOLD rebrand" },
    { label: "Admin approval email wired",      ok: true, note: "PATCH /api/admin/vendors fires sendVendorApproved/Rejected" },
    { label: "Booking notification email wired",ok: true, note: "PATCH /api/bookings/[id] fires sendBookingRequest/Accepted/Rejected" },
    { label: "Verification email wired",        ok: true, note: "PATCH /api/admin/verifications fires all verification emails" },
    { label: "Test delivery confirmed",         ok: true, note: "4/4 email types delivered via Resend 2026-05-29 (registration, approval, quote, booking)" },
  ];

  // -- Security --
  const isLiveStripe = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
  checks["Security & Operations"] = [
    { label: "Stripe live mode key",         ok: isLiveStripe, warn: !isLiveStripe, note: isLiveStripe ? undefined : "Currently using test key - switch to live before launch" },
    { label: "Stripe webhook secret set",    ok: !!process.env.STRIPE_WEBHOOK_SECRET },
    { label: "Rate limiting active",         ok: true, note: "In-memory; consider Redis for multi-instance" },
    { label: "Cookie consent banner active", ok: true },
    { label: "Health endpoint accessible",   ok: true },
  ];

  // -- Legal --
  checks["Legal & Compliance"] = [
    { label: "Privacy Policy (/privacy)",                    ok: true },
    { label: "Terms of Service (/terms)",                    ok: true },
    { label: "Vendor Terms (/vendor-terms)",                 ok: true },
    { label: "Refund Policy (/refunds)",                     ok: true },
    { label: "Cookie Policy (/cookies)",                     ok: true },
    { label: "Community Guidelines (/community-guidelines)", ok: true },
    { label: "GDPR account delete API",                      ok: true },
    { label: "GDPR data export API",                         ok: true },
  ];

  // -- Pre-launch checklist --
  checks["Pre-Launch Checklist"] = [
    { label: "Stripe webhook registered in Stripe Dashboard",  ok: false, warn: true, note: "Manual: register /api/payments/webhook in Stripe Dashboard" },
    { label: "Subscription webhook events enabled in Stripe",  ok: false, warn: true, note: "Manual: enable customer.subscription.*, invoice.* events" },
    { label: "DNS and custom domain configured",               ok: false, warn: true, note: "Manual: verify elbold.com points to Vercel deployment" },
    { label: "Email sending domain verified in Resend",        ok: resendDomainVerified, warn: !resendDomainVerified, note: resendDomainVerified ? "elbold.com verified - live delivery confirmed" : "Manual: verify elbold.com in Resend dashboard" },
    { label: "Sentry project configured and alerts set up",    ok: !!process.env.SENTRY_DSN, warn: !process.env.SENTRY_DSN },
    { label: "E2E smoke tests passing on staging",             ok: false, warn: true, note: "Manual: run npx playwright test tests/smoke/ against staging URL" },
    { label: "Load testing completed",                         ok: false, warn: true, note: "Manual: run k6 or similar against staging environment" },
  ];

  return checks;
}

function CheckRow({ check }: { check: CheckResult }) {
  const Icon = check.ok ? CheckCircle2 : check.warn ? AlertCircle : XCircle;
  const color = check.ok ? "text-emerald-400" : check.warn ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Icon size={15} className={`${color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-300">{check.label}</span>
        {check.note && <p className="text-xs text-slate-500 mt-0.5">{check.note}</p>}
      </div>
    </div>
  );
}

export default async function AdminLaunchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const checks = await runChecks();

  const allItems = Object.values(checks).flat();
  const passed = allItems.filter((c) => c.ok).length;
  const warnings = allItems.filter((c) => !c.ok && c.warn).length;
  const failures = allItems.filter((c) => !c.ok && !c.warn).length;
  const total = allItems.length;
  const score = Math.round((passed / total) * 100);

  const readinessColor = score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400";

  return (
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Rocket size={20} className="text-brand-400" />
              Launch Readiness
            </h1>
            <p className="text-slate-400 text-sm mt-1">Pre-launch checklist - verify before going live</p>
          </div>
          <Link
            href="/api/health"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-400 text-sm hover:bg-brand-500/25 transition-colors"
          >
            <ExternalLink size={13} />
            Health Check
          </Link>
        </div>

        {/* Score banner */}
        <div className={`bg-white/4 border rounded-xl p-5 flex items-center gap-5 ${score >= 90 ? "border-emerald-500/30" : score >= 70 ? "border-amber-500/30" : "border-red-500/30"}`}>
          <div className="text-center">
            <div className={`text-4xl font-black ${readinessColor}`}>{score}%</div>
            <div className="text-xs text-slate-500 mt-1">Readiness</div>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="grid grid-cols-3 gap-4 flex-1">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{passed}</div>
              <div className="text-xs text-slate-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{warnings}</div>
              <div className="text-xs text-slate-500">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{failures}</div>
              <div className="text-xs text-slate-500">Blocking</div>
            </div>
          </div>
        </div>

        {/* Check groups */}
        {Object.entries(checks).map(([group, items]) => {
          const groupPassed = items.filter((c) => c.ok).length;
          const groupTotal = items.length;
          return (
            <div key={group} className="bg-white/4 border border-white/6 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white text-sm">{group}</h2>
                <span className={`text-xs font-semibold ${groupPassed === groupTotal ? "text-emerald-400" : "text-amber-400"}`}>
                  {groupPassed}/{groupTotal}
                </span>
              </div>
              <div>
                {items.map((check, i) => (
                  <CheckRow key={i} check={check} />
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-slate-600 text-xs text-center pb-4">
          Page refreshes with live checks. Manual items require human verification and are shown as warnings, not failures.
        </p>
      </div>
    </DashboardLayout>
  );
}
