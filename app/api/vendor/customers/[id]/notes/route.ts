import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Security: all routes derive vendor_id from the authenticated session.
// The RLS policy on vendor_customer_notes enforces the same constraint at the
// database layer, so even if application logic were bypassed, cross-vendor
// access would still be blocked.

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: customerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data: notes, error } = await supabase
    .from("vendor_customer_notes")
    .select("id, note, created_at, updated_at")
    .eq("vendor_id", vendor.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: notes ?? [] });
}

export async function POST(req: Request, { params }: Params) {
  const { id: customerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const body = await req.json() as { note?: string };
  if (!body.note?.trim()) {
    return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
  }

  // Belt-and-braces: confirm customer is in this vendor's network before
  // inserting a note. RLS would block it anyway but this returns a meaningful 404.
  const [bRes, qRes] = await Promise.all([
    supabase.from("bookings").select("id").eq("vendor_id", vendor.id).eq("customer_id", customerId).limit(1),
    supabase.from("quotes").select("id").eq("vendor_id", vendor.id).eq("customer_id", customerId).limit(1),
  ]);
  const isLinked = (bRes.data?.length ?? 0) > 0 || (qRes.data?.length ?? 0) > 0;
  if (!isLinked) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const { data: note, error } = await supabase
    .from("vendor_customer_notes")
    .insert({ vendor_id: vendor.id, customer_id: customerId, note: body.note.trim() })
    .select("id, note, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id: customerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("note_id");
  if (!noteId) return NextResponse.json({ error: "note_id required" }, { status: 400 });

  // RLS ensures vendor can only delete their own notes
  const { error } = await supabase
    .from("vendor_customer_notes")
    .delete()
    .eq("id", noteId)
    .eq("vendor_id", vendor.id)
    .eq("customer_id", customerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
