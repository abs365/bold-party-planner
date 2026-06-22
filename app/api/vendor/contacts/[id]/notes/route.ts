import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data: notes, error } = await supabase
    .from("manual_contact_notes")
    .select("id, note, created_at, updated_at")
    .eq("vendor_id", vendor.id)
    .eq("manual_contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: notes ?? [] });
}

export async function POST(req: Request, { params }: Params) {
  const { id: contactId } = await params;
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

  // Confirm contact belongs to this vendor before inserting
  const { data: contact } = await supabase
    .from("manual_contacts").select("id").eq("id", contactId).eq("vendor_id", vendor.id).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const { data: note, error } = await supabase
    .from("manual_contact_notes")
    .insert({ vendor_id: vendor.id, manual_contact_id: contactId, note: body.note.trim() })
    .select("id, note, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id: contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("note_id");
  if (!noteId) return NextResponse.json({ error: "note_id required" }, { status: 400 });

  const { error } = await supabase
    .from("manual_contact_notes")
    .delete()
    .eq("id", noteId)
    .eq("vendor_id", vendor.id)
    .eq("manual_contact_id", contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
