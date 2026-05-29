import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";

const submitSchema = z.object({
  type: z.string().min(1),
  document_url: z.string().url(),
  file_name: z.string().optional(),
  notes: z.string().max(500).optional(),
});

async function requireVendor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, category, verification_level, status")
    .eq("user_id", user.id)
    .single();
  if (!vendor) return null;
  return { supabase, user, vendor };
}

export async function GET() {
  const auth = await requireVendor();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: verifications } = await auth.supabase
    .from("vendor_verifications")
    .select("*, documents:verification_documents(*)")
    .eq("vendor_id", auth.vendor.id)
    .order("created_at", { ascending: false });

  const { data: activityLog } = await auth.supabase
    .from("verification_activity_log")
    .select("*")
    .eq("vendor_id", auth.vendor.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ verifications: verifications ?? [], activityLog: activityLog ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireVendor();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, document_url, file_name, notes } = parsed.data;

  // Check if a previous submission was rejected with resubmission disallowed
  const { data: existing } = await auth.supabase
    .from("vendor_verifications")
    .select("id, status, resubmission_allowed, resubmit_count")
    .eq("vendor_id", auth.vendor.id)
    .eq("type", type)
    .single();

  if (existing?.status === "rejected" && !existing.resubmission_allowed) {
    return NextResponse.json({ error: "Resubmission not allowed for this document type" }, { status: 403 });
  }

  const isResubmission = existing?.status === "rejected";
  const now = new Date().toISOString();

  // Upsert the verification record
  const { data: verification, error: verError } = await auth.supabase
    .from("vendor_verifications")
    .upsert({
      vendor_id: auth.vendor.id,
      type,
      status: "pending",
      document_url,
      submitted_at: now,
      notes: notes ?? null,
      rejection_reason: null,
      resubmit_count: isResubmission ? (existing.resubmit_count ?? 0) + 1 : 0,
      reviewed_at: null,
      reviewer_id: null,
    }, { onConflict: "vendor_id,type" })
    .select()
    .single();

  if (verError) return NextResponse.json({ error: verError.message }, { status: 500 });

  // Audit + analytics (fire-and-forget)
  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole: "vendor",
    action: isResubmission ? "vendor.verification.resubmit" : "vendor.verification.submit",
    entityType: "vendor_verification",
    entityId: verification?.id ?? auth.vendor.id,
    ipAddress: ipFromRequest(req),
  });
  void track({
    event: "vendor.verification.submitted",
    userId: auth.user.id,
    properties: { type, isResubmission },
  });

  // Log the activity
  await auth.supabase.from("verification_activity_log").insert({
    vendor_id: auth.vendor.id,
    verification_id: verification?.id ?? null,
    actor_id: auth.user.id,
    actor_type: "vendor",
    action: isResubmission ? "resubmitted" : "submitted",
    new_status: "pending",
    notes: notes ?? null,
    metadata: { type, file_name: file_name ?? null },
  });

  return NextResponse.json(verification);
}
