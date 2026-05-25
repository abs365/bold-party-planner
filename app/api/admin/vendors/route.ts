import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

async function requireAdmin() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  return user;
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const supabase = await createAdminClient();
  let query = supabase
    .from("vendors")
    .select("*, profile:profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("business_name", `%${search}%`);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vendor_id, status, featured, verified } = await request.json() as {
    vendor_id: string;
    status?: string;
    featured?: boolean;
    verified?: boolean;
  };

  const supabase = await createAdminClient();
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (typeof featured === "boolean") updates.featured = featured;
  if (typeof verified === "boolean") updates.verified = verified;

  const { data: vendor, error } = await supabase
    .from("vendors")
    .update(updates)
    .eq("id", vendor_id)
    .select("*, profile:profiles(email, full_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email notifications for approval/rejection
  const profile = vendor.profile as Record<string, string>;
  if (status === "approved" && profile?.email) {
    const { sendVendorApproved } = await import("@/lib/resend");
    void sendVendorApproved(profile.email, profile.full_name ?? "Vendor", vendor.business_name);
  } else if (status === "rejected" && profile?.email) {
    const { sendVendorRejected } = await import("@/lib/resend");
    void sendVendorRejected(profile.email, profile.full_name ?? "Vendor", vendor.business_name);
  }

  return NextResponse.json(vendor);
}
