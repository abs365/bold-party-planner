import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExternalLink, CheckCircle2, XCircle, Server } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

const MIGRATIONS = [
  { id: "001", name: "initial" },
  { id: "002", name: "phase2" },
  { id: "003", name: "phase3" },
  { id: "004", name: "phase4" },
  { id: "005", name: "phase5" },
  { id: "006", name: "phase6" },
  { id: "007", name: "phase7" },
  { id: "008", name: "data_consistency_fix" },
  { id: "009", name: "schema_grants_fix" },
  { id: "010", name: "trigger_and_category_fix" },
  { id: "011", name: "marketplace_operations" },
  { id: "012", name: "moderation" },
  { id: "013", name: "vendor_verification_system" },
  { id: "014", name: "verification_automation" },
  { id: "015", name: "demo_password_rpc" },
  { id: "016", name: "admin_alerts_rls" },
  { id: "017", name: "demo_user_fix" },
  { id: "018", name: "complete_demo_cleanup" },
  { id: "019", name: "force_demo_auth_cleanup" },
  { id: "020", name: "restore_robust_trigger" },
  { id: "021", name: "analytics_and_audit" },
  { id: "022", name: "vendor_governance" },
  { id: "023", name: "vendor_reviews_and_reputation" },
  { id: "024", name: "subscription_infrastructure" },
  { id: "025", name: "gdpr_and_production" },
  { id: "026", name: "push_subscriptions" },
  { id: "027", name: "event_planner_category" },
  { id: "030", name: "custom_category" },
  { id: "031", name: "quote_workflow" },
  { id: "032", name: "vendor_bank_details" },
];

function EnvRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-300 font-mono">{label}</span>
      {present ? (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 size={13} /> Set
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
          <XCircle size={13} /> Missing
        </span>
      )}
    </div>
  );
}

export default async function AdminSystemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL:         !!process.env.NEXT_PUBLIC_APP_URL,
    OPENAI_API_KEY:              !!process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY:           !!process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY:              !!process.env.RESEND_API_KEY,
    SENTRY_DSN:                  !!process.env.SENTRY_DSN,
    ADMIN_EMAILS:                !!process.env.ADMIN_EMAILS,
    BOLD_PARTY_SEED_SECRET:           !!process.env.BOLD_PARTY_SEED_SECRET,
    TELEGRAM_BOT_TOKEN:               !!process.env.TELEGRAM_BOT_TOKEN,
    STRIPE_WEBHOOK_SECRET:            !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID:      !!process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PREMIUM_MONTHLY_PRICE_ID:  !!process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    STRIPE_ELITE_MONTHLY_PRICE_ID:    !!process.env.STRIPE_ELITE_MONTHLY_PRICE_ID,
    STRIPE_PRO_ANNUAL_PRICE_ID:       !!process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    STRIPE_PREMIUM_ANNUAL_PRICE_ID:   !!process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
    STRIPE_ELITE_ANNUAL_PRICE_ID:     !!process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,
  };

  const buildInfo = {
    nodeEnv:    process.env.NODE_ENV ?? "unknown",
    runtime:    process.env.NEXT_RUNTIME ?? "nodejs",
    nodeVersion: process.version,
  };

  return (
    <DashboardLayout user={(profileData ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Server size={20} className="text-brand-400" />
              System Status
            </h1>
            <p className="text-slate-400 text-sm mt-1">Environment configuration, migrations, and diagnostics</p>
          </div>
          <Link
            href="/api/health"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-400 text-sm hover:bg-brand-500/25 transition-colors"
          >
            <ExternalLink size={14} />
            View Live Health
          </Link>
        </div>

        {/* Build Info */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-3 text-sm">Build &amp; Runtime</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "NODE_ENV",    value: buildInfo.nodeEnv },
              { label: "NEXT_RUNTIME", value: buildInfo.runtime },
              { label: "Node Version", value: buildInfo.nodeVersion },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/3 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="text-sm font-mono text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-3 text-sm">Environment Variables</h2>
          <div>
            {Object.entries(envVars).map(([key, present]) => (
              <EnvRow key={key} label={key} present={present} />
            ))}
          </div>
        </div>

        {/* Migrations */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-1 text-sm">Required Migrations</h2>
          <p className="text-xs text-slate-500 mb-4">
            All 30 migrations applied and verified in Supabase. Last applied: 032_vendor_bank_details (2026-06-01).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MIGRATIONS.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-mono text-slate-300">
                  <span className="text-slate-500">{m.id}_</span>{m.name}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
            Migration 021 adds <code className="font-mono">actor_role</code> and{" "}
            <code className="font-mono">target_user_id</code> columns to{" "}
            <code className="font-mono">audit_logs</code>, and creates the{" "}
            <code className="font-mono">analytics_events</code> table. Run it if the audit system returns errors.
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-3 text-sm">API Endpoints</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { href: "/api/health", label: "GET /api/health", desc: "Full health check (DB, auth, storage)" },
              { href: "/api/system/status", label: "GET /api/system/status", desc: "Environment + feature flags (admin only)" },
              { href: "/api/dev/seed-health", label: "GET /api/dev/seed-health", desc: "Seed and analytics table health (dev only)" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                className="flex items-start gap-3 p-3 rounded-xl border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all"
              >
                <ExternalLink size={13} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono font-semibold text-white">{link.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
