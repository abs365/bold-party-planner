import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ManualContactSource } from "@/types";

const ALLOWED_SOURCES: ManualContactSource[] = [
  "instagram","facebook","tiktok","whatsapp",
  "referral","existing_customer","direct","other",
];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data: contact, error } = await supabase
    .from("manual_contacts")
    .select("id, display_name, display_email, display_phone, source, source_detail, notes, linked_profile_id, is_archived, gdpr_anonymised, created_at, updated_at")
    .eq("id", contactId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  return NextResponse.json({ contact });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id: contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const body = await req.json() as {
    display_name?: string;
    display_email?: string | null;
    display_phone?: string | null;
    source?: string;
    source_detail?: string | null;
    notes?: string | null;
    is_archived?: boolean;
  };

  if (body.display_name !== undefined && !body.display_name.trim()) {
    return NextResponse.json({ error: "display_name cannot be empty" }, { status: 400 });
  }
  if (body.source !== undefined && !ALLOWED_SOURCES.includes(body.source as ManualContactSource)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.display_name  !== undefined) patch.display_name  = body.display_name.trim();
  if (body.display_email !== undefined) patch.display_email = body.display_email?.trim() || null;
  if (body.display_phone !== undefined) patch.display_phone = body.display_phone?.trim() || null;
  if (body.source        !== undefined) patch.source        = body.source;
  if (body.source_detail !== undefined) patch.source_detail = body.source_detail?.trim() || null;
  if (body.notes         !== undefined) patch.notes         = body.notes?.trim() || null;
  if (body.is_archived   !== undefined) patch.is_archived   = body.is_archived;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: contact, error } = await supabase
    .from("manual_contacts")
    .update(patch)
    .eq("id", contactId)
    .eq("vendor_id", vendor.id)
    .select("id, display_name, display_email, display_phone, source, source_detail, notes, linked_profile_id, is_archived, gdpr_anonymised, created_at, updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  return NextResponse.json({ contact });
}
