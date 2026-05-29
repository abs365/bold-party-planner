import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type AnonClient = Awaited<ReturnType<typeof createClient>>;
type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export type AuthContext = { user: User; supabase: AnonClient };
export type VendorContext = AuthContext & { vendorId: string };
export type AdminContext = { user: User; db: AdminClient };

export async function requireAuth(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { user, supabase };
}

export async function requireAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  const db = await createAdminClient();
  return { user, db };
}

export async function requireVendor(): Promise<VendorContext | null> {
  const ctx = await requireAuth();
  if (!ctx) return null;
  const { data: vendor } = await ctx.supabase
    .from("vendors")
    .select("id")
    .eq("user_id", ctx.user.id)
    .single();
  if (!vendor) return null;
  return { ...ctx, vendorId: vendor.id };
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });
