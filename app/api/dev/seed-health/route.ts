import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Block in all production-like environments
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Require authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createAdminClient();

  // Check analytics_events table
  let analyticsTable: "ok" | "error" = "error";
  try {
    const { error } = await db.from("analytics_events").select("id", { count: "exact", head: true });
    if (!error) analyticsTable = "ok";
  } catch {
    analyticsTable = "error";
  }

  // Check audit_logs has actor_role column (try selecting it)
  let auditTable: "ok" | "error" = "error";
  try {
    const { error } = await db
      .from("audit_logs")
      .select("id, actor_role", { count: "exact", head: true });
    if (!error) auditTable = "ok";
  } catch {
    auditTable = "error";
  }

  // Count demo vendors
  let demoVendorsCount = 0;
  try {
    const { count } = await db
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .ilike("business_name", "%demo%");
    demoVendorsCount = count ?? 0;
  } catch {
    demoVendorsCount = 0;
  }

  // Count demo customers (profiles with demo in email via auth metadata — approximate via profiles)
  let demoCustomersCount = 0;
  try {
    const { count } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer");
    demoCustomersCount = count ?? 0;
  } catch {
    demoCustomersCount = 0;
  }

  const seedSecretPrefix = process.env.BOLD_PARTY_SEED_SECRET
    ? `BOLD_PARTY_SEED_${process.env.BOLD_PARTY_SEED_SECRET.slice(0, 4)}****`
    : "BOLD_PARTY_SEED_(not set)";

  return NextResponse.json({
    seed_secret_prefix:    seedSecretPrefix,
    analytics_table:       analyticsTable,
    audit_table:           auditTable,
    demo_vendors_count:    demoVendorsCount,
    demo_customers_count:  demoCustomersCount,
  });
}
