import { redirect } from "next/navigation";
import Link from "next/link";
import { readdirSync } from "fs";
import { join } from "path";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExternalLink, CheckCircle2, XCircle, Server } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

// Reads the real migrations directory at request time rather than a
// hand-maintained list - the hardcoded version of this list was found stuck
// at 30 migrations (last: 032, dated 2026-06-01) during a live production
// audit, while the repo actually had 73 migration files (up to 070) at the
// time of that same audit. A manually-updated list of this kind will always
// eventually go stale; reading the directory cannot.
function getMigrations(): { id: string; name: string }[] {
  try {
    const dir = join(process.cwd(), "supabase", "migrations");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => {
        const withoutExt = f.replace(/\.sql$/, "");
        const [id, ...rest] = withoutExt.split("_");
        return { id, name: rest.join("_") };
      });
  } catch {
    return [];
  }
}

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
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const { data: profileData } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

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
    STRIPE_CONNECT_WEBHOOK_SECRET:    !!process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    STRIPE_CONNECT_ENABLED:           process.env.STRIPE_CONNECT_ENABLED === "true",
    // These were checked under the wrong variable names until this fix
    // (STRIPE_PRO_MONTHLY_PRICE_ID etc.) - confirmed live in production that
    // the real, correctly-configured vars use *_PRICE_MONTHLY / *_PRICE_YEARLY.
    STRIPE_PRO_PRICE_MONTHLY:         !!process.env.STRIPE_PRO_PRICE_MONTHLY,
    STRIPE_PRO_PRICE_YEARLY:          !!process.env.STRIPE_PRO_PRICE_YEARLY,
    STRIPE_PREMIUM_PRICE_MONTHLY:     !!process.env.STRIPE_PREMIUM_PRICE_MONTHLY,
    STRIPE_PREMIUM_PRICE_YEARLY:      !!process.env.STRIPE_PREMIUM_PRICE_YEARLY,
    STRIPE_ELITE_PRICE_MONTHLY:       !!process.env.STRIPE_ELITE_PRICE_MONTHLY,
    STRIPE_ELITE_PRICE_YEARLY:        !!process.env.STRIPE_ELITE_PRICE_YEARLY,
  };

  const migrations = getMigrations();
  const lastMigration = migrations[migrations.length - 1];

  const buildInfo = {
    nodeEnv:    process.env.NODE_ENV ?? "unknown",
    runtime:    process.env.NEXT_RUNTIME ?? "nodejs",
    nodeVersion: process.version,
  };

  return (
    <DashboardLayout user={(profileData ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
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
          <h2 className="font-semibold text-white mb-1 text-sm">Migration Files in Deployed Code</h2>
          <p className="text-xs text-slate-500 mb-4">
            {migrations.length} migration files present in this deployment&apos;s <code className="font-mono">supabase/migrations</code> directory.
            {lastMigration && <> Last: <code className="font-mono">{lastMigration.id}_{lastMigration.name}</code>.</>}{" "}
            This reflects what shipped with the code, not independent confirmation that every migration has been applied to this database - cross-check with <code className="font-mono">supabase migration list</code> if in doubt.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {migrations.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-mono text-slate-300">
                  <span className="text-slate-500">{m.id}_</span>{m.name}
                </span>
              </div>
            ))}
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
