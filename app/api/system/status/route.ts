import { NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const MIGRATIONS = [
  { id: "001", name: "initial",                     status: "applied" },
  { id: "002", name: "phase2",                      status: "applied" },
  { id: "003", name: "phase3",                      status: "applied" },
  { id: "004", name: "phase4",                      status: "applied" },
  { id: "005", name: "phase5",                      status: "applied" },
  { id: "006", name: "phase6",                      status: "applied" },
  { id: "007", name: "phase7",                      status: "applied" },
  { id: "008", name: "data_consistency_fix",        status: "applied" },
  { id: "009", name: "schema_grants_fix",           status: "applied" },
  { id: "010", name: "trigger_and_category_fix",    status: "applied" },
  { id: "011", name: "marketplace_operations",      status: "applied" },
  { id: "012", name: "moderation",                  status: "applied" },
  { id: "013", name: "vendor_verification_system",  status: "applied" },
  { id: "014", name: "verification_automation",     status: "applied" },
  { id: "015", name: "demo_password_rpc",           status: "applied" },
  { id: "016", name: "admin_alerts_rls",            status: "applied" },
  { id: "017", name: "demo_user_fix",               status: "applied" },
  { id: "018", name: "complete_demo_cleanup",       status: "applied" },
  { id: "019", name: "force_demo_auth_cleanup",     status: "applied" },
  { id: "020", name: "restore_robust_trigger",      status: "applied" },
  { id: "021", name: "analytics_and_audit",          status: "applied" },
  { id: "022", name: "vendor_governance",            status: "applied" },
  { id: "023", name: "vendor_reviews_and_reputation", status: "applied" },
  { id: "024", name: "subscription_infrastructure", status: "applied" },
  { id: "025", name: "gdpr_and_production",         status: "applied" },
  { id: "026", name: "push_subscriptions",          status: "applied" },
  { id: "027", name: "event_planner_category",      status: "applied" },
  { id: "030", name: "custom_category",             status: "applied" },
  { id: "031", name: "quote_workflow",              status: "applied" },
  { id: "032", name: "vendor_bank_details",         status: "applied" },
];

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  return NextResponse.json({
    environment: {
      NODE_ENV:     process.env.NODE_ENV ?? "unknown",
      NEXT_RUNTIME: process.env.NEXT_RUNTIME ?? "nodejs",
    },
    features: {
      sentry:         !!process.env.SENTRY_DSN,
      openai:         !!process.env.OPENAI_API_KEY,
      stripe:         !!process.env.STRIPE_SECRET_KEY,
      stripeWebhook:  !!process.env.STRIPE_WEBHOOK_SECRET,
      stripePrices:   !!(
        process.env.STRIPE_PRO_PRICE_MONTHLY &&
        process.env.STRIPE_PREMIUM_PRICE_MONTHLY &&
        process.env.STRIPE_ELITE_PRICE_MONTHLY
      ),
      resend:         !!process.env.RESEND_API_KEY,
    },
    migrations: MIGRATIONS,
    timestamp: new Date().toISOString(),
  });
}
