import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type AnonClient = Awaited<ReturnType<typeof createClient>>;
type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export type AdminRole = "founder" | "global_admin" | "ops_admin" | "reviewer";

export const ROLE_WEIGHT: Record<AdminRole, number> = {
  founder:      4,
  global_admin: 3,
  ops_admin:    2,
  reviewer:     1,
};

export type AuthContext  = { user: User; supabase: AnonClient };
export type VendorContext = AuthContext & { vendorId: string };
export type AdminContext  = { user: User; db: AdminClient; role: AdminRole };

export async function requireAuth(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { user, supabase };
}

export async function requireAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = await createAdminClient();

  // Founder: anchored exclusively to ADMIN_EMAILS env var — never stored in admin_roles
  if (ADMIN_EMAILS.includes(user.email ?? "")) {
    return { user, db, role: "founder" };
  }

  // Non-founder: resolve role from admin_roles table
  const { data: roleRow } = await db
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!roleRow) return null;

  return { user, db, role: roleRow.role as Exclude<AdminRole, "founder"> };
}

// Returns the admin context only if the caller's role meets the minimum weight.
// Use this in Phase 70D.5 when route-level enforcement is activated.
export async function requireAdminRole(minRole: AdminRole): Promise<AdminContext | null> {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  if (ROLE_WEIGHT[ctx.role] >= ROLE_WEIGHT[minRole]) return ctx;
  return null;
}

export async function requireVendor(): Promise<VendorContext | null> {
  const ctx = await requireAuth();
  if (!ctx) return null;
  const { data: vendor } = await ctx.supabase
    .from("vendors")
    .select("id")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!vendor) return null;
  return { ...ctx, vendorId: vendor.id };
}

export async function requireApprovedVendor(): Promise<VendorContext | null> {
  const ctx = await requireAuth();
  if (!ctx) return null;
  const { data: vendor } = await ctx.supabase
    .from("vendors")
    .select("id, status")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!vendor || vendor.status !== "approved") return null;
  return { ...ctx, vendorId: vendor.id };
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });
