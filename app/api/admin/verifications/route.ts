import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  return { supabase, user };
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  const { data, error } = await auth.supabase
    .from("vendor_verifications")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city, user_id,
        profile:profiles(full_name, email)
      )
    `)
    .eq("status", status)
    .order("submitted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, notes } = await req.json() as {
    id: string;
    status: "approved" | "rejected";
    notes?: string;
  };

  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("vendor_verifications")
    .update({
      status,
      notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewer_id: auth.user.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If this is an identity or business verification approval, mark vendor as verified
  if (status === "approved" && data) {
    const { data: allVerifs } = await auth.supabase
      .from("vendor_verifications")
      .select("type, status")
      .eq("vendor_id", data.vendor_id);

    const identityApproved = allVerifs?.some((v) => v.type === "identity" && v.status === "approved");
    if (identityApproved) {
      await auth.supabase.from("vendors").update({ verified: true }).eq("id", data.vendor_id);
    }
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { vendor_id, type } = await req.json() as { vendor_id: string; type: string };

  if (!vendor_id || !type) return NextResponse.json({ error: "vendor_id and type required" }, { status: 400 });

  // Admin can manually create a verification request
  const { data, error } = await auth.supabase
    .from("vendor_verifications")
    .upsert({
      vendor_id,
      type,
      status: "pending",
      submitted_at: new Date().toISOString(),
    }, { onConflict: "vendor_id,type" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
