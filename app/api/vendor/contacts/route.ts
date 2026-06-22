import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ManualContactSource } from "@/types";

const ALLOWED_SOURCES: ManualContactSource[] = [
  "instagram","facebook","tiktok","whatsapp",
  "referral","existing_customer","direct","other",
];

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search") ?? "";
  const source   = searchParams.get("source") ?? "";
  const archived = searchParams.get("archived") === "true";

  let query = supabase
    .from("manual_contacts")
    .select("id, display_name, display_email, display_phone, source, source_detail, notes, linked_profile_id, is_archived, gdpr_anonymised, created_at, updated_at")
    .eq("vendor_id", vendor.id)
    .eq("is_archived", archived)
    .order("created_at", { ascending: false });

  if (source && ALLOWED_SOURCES.includes(source as ManualContactSource)) {
    query = query.eq("source", source);
  }

  const { data: contacts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Client-side search filter (name/email)
  const filtered = search.trim()
    ? (contacts ?? []).filter((c) => {
        const q = search.toLowerCase();
        return (
          c.display_name.toLowerCase().includes(q) ||
          (c.display_email ?? "").toLowerCase().includes(q) ||
          (c.display_phone ?? "").includes(q)
        );
      })
    : (contacts ?? []);

  return NextResponse.json({ contacts: filtered });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const body = await req.json() as {
    display_name?: string;
    display_email?: string;
    display_phone?: string;
    source?: string;
    source_detail?: string;
    notes?: string;
  };

  if (!body.display_name?.trim()) {
    return NextResponse.json({ error: "display_name is required" }, { status: 400 });
  }
  if (body.source && !ALLOWED_SOURCES.includes(body.source as ManualContactSource)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const { data: contact, error } = await supabase
    .from("manual_contacts")
    .insert({
      vendor_id:    vendor.id,
      display_name: body.display_name.trim(),
      display_email: body.display_email?.trim() || null,
      display_phone: body.display_phone?.trim() || null,
      source:       (body.source as ManualContactSource) ?? "direct",
      source_detail: body.source_detail?.trim() || null,
      notes:        body.notes?.trim() || null,
    })
    .select("id, display_name, display_email, display_phone, source, source_detail, notes, linked_profile_id, is_archived, gdpr_anonymised, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact }, { status: 201 });
}
