import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, forbidden } from "@/lib/auth/guards";
import {
  sendVerificationApproved,
  sendVerificationRejected,
  sendResubmissionRequested,
  sendLevelUpgraded,
} from "@/lib/resend/verification-emails";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { getRequirementsForCategory } from "@/lib/verification-requirements";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let query = auth.db
    .from("vendor_verifications")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city, verified, verification_level, suspicious_flag, status,
        profile:profiles(full_name, email)
      )
    `)
    .order("submitted_at", { ascending: true });

  if (status === "suspended") {
    const { data: suspendedVendors } = await auth.db.from("vendors").select("id").eq("status", "suspended");
    const ids = (suspendedVendors ?? []).map((v) => v.id);
    if (ids.length === 0) return NextResponse.json([]);
    query = query.in("vendor_id", ids);
  } else if (status === "expired") {
    return NextResponse.json([]);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }
  if (category) query = query.eq("vendor.category", category);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let results = data ?? [];
  if (search) {
    const lower = search.toLowerCase();
    results = results.filter((v) =>
      (v.vendor as { business_name?: string })?.business_name?.toLowerCase().includes(lower)
    );
  }

  return NextResponse.json(results);
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "flag", "unflag", "request_resubmission", "set_level"]),
  notes: z.string().max(1000).optional(),
  rejection_reason: z.string().max(500).optional(),
  resubmission_allowed: z.boolean().optional(),
  suspicious_reason: z.string().max(500).optional(),
  level: z.number().int().min(0).max(4).optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, action, notes, rejection_reason, resubmission_allowed, suspicious_reason, level } = parsed.data;
  const now = new Date().toISOString();

  // Get current verification
  const { data: verif } = await auth.db
    .from("vendor_verifications")
    .select("*, vendor:vendors(id, verification_level, verified, category, status)")
    .eq("id", id)
    .maybeSingle();

  if (!verif) return NextResponse.json({ error: "Verification not found" }, { status: 404 });

  const vendor = verif.vendor as { id: string; verification_level: number; verified: boolean; category: string; status: string };

  // Fetch vendor contact for emails
  async function getVendorContact(): Promise<{ email: string; name: string } | null> {
    const { data } = await auth!.db
      .from("vendors")
      .select("user_id, business_name, profile:profiles(email, full_name)")
      .eq("id", vendor.id)
      .single();
    const profile = (data?.profile as { email?: string; full_name?: string | null } | null);
    if (!profile?.email) return null;
    return { email: profile.email, name: data?.business_name ?? profile.full_name ?? "Vendor" };
  }

  if (action === "approve") {
    const { data, error } = await auth.db
      .from("vendor_verifications")
      .update({
        status: "approved",
        notes: notes ?? null,
        admin_notes: notes ?? null,
        reviewed_at: now,
        reviewer_id: auth.user.id,
        rejection_reason: null,
        resubmission_allowed: true,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Check if all required documents are approved → upgrade verification_level
    const { data: allVerifs } = await auth.db
      .from("vendor_verifications")
      .select("type, status")
      .eq("vendor_id", vendor.id);

    // Level 2: government ID approved
    const hasGovId = allVerifs?.some((v) =>
      (v.type === "government_id" || v.type === "identity") && v.status === "approved"
    );

    const updates: Record<string, unknown> = {};
    if (hasGovId) {
      updates.verified = true;
      if (vendor.verification_level < 2) updates.verification_level = 2;
    }

    // Level 3: all category-required documents approved
    const requiredDocs = getRequirementsForCategory(vendor.category);
    const allRequiredApproved = requiredDocs.every((docType) =>
      allVerifs?.some((v) => v.type === docType && v.status === "approved")
    );
    if (allRequiredApproved && vendor.verification_level < 3) {
      updates.verification_level = 3;
    }

    if (Object.keys(updates).length > 0) {
      await auth.db.from("vendors").update(updates).eq("id", vendor.id);
    }

    await auth.db.from("verification_activity_log").insert({
      vendor_id: vendor.id,
      verification_id: id,
      actor_id: auth.user.id,
      actor_type: "admin",
      action: "approved",
      old_status: verif.status,
      new_status: "approved",
      notes: notes ?? null,
    });

    // Audit + analytics (fire-and-forget)
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: "admin.verification.approve",
      entityType: "vendor_verification",
      entityId: id,
      targetUserId: vendor.id,
      ipAddress: ipFromRequest(req),
    });
    void track({ event: "vendor.verification.approved", userId: auth.user.id, properties: { verification_id: id, vendor_id: vendor.id } });

    // Send email + level-upgrade email if level changed
    const contact = await getVendorContact();
    if (contact) {
      void sendVerificationApproved(contact.email, contact.name, verif.type as string);
      if (updates.verification_level) {
        void sendLevelUpgraded(contact.email, contact.name, updates.verification_level as number);
      }
    }

    return NextResponse.json(data);
  }

  if (action === "reject") {
    const { data, error } = await auth.db
      .from("vendor_verifications")
      .update({
        status: "rejected",
        notes: notes ?? null,
        admin_notes: notes ?? null,
        rejection_reason: rejection_reason ?? null,
        resubmission_allowed: resubmission_allowed ?? true,
        reviewed_at: now,
        reviewer_id: auth.user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await auth.db.from("verification_activity_log").insert({
      vendor_id: vendor.id,
      verification_id: id,
      actor_id: auth.user.id,
      actor_type: "admin",
      action: "rejected",
      old_status: verif.status,
      new_status: "rejected",
      notes: rejection_reason ?? notes ?? null,
    });

    // Audit + analytics (fire-and-forget)
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: "admin.verification.reject",
      entityType: "vendor_verification",
      entityId: id,
      targetUserId: vendor.id,
      ipAddress: ipFromRequest(req),
    });
    void track({ event: "vendor.verification.rejected", userId: auth.user.id, properties: { verification_id: id, vendor_id: vendor.id } });

    const rejectContact = await getVendorContact();
    if (rejectContact) {
      void sendVerificationRejected(
        rejectContact.email, rejectContact.name, verif.type as string,
        rejection_reason ?? "", resubmission_allowed ?? true
      );
    }

    return NextResponse.json(data);
  }

  if (action === "request_resubmission") {
    const { data, error } = await auth.db
      .from("vendor_verifications")
      .update({
        status: "rejected",
        rejection_reason: rejection_reason ?? "Please resubmit with a clearer document",
        resubmission_allowed: true,
        admin_notes: notes ?? null,
        reviewed_at: now,
        reviewer_id: auth.user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await auth.db.from("verification_activity_log").insert({
      vendor_id: vendor.id,
      verification_id: id,
      actor_id: auth.user.id,
      actor_type: "admin",
      action: "resubmission_requested",
      old_status: verif.status,
      new_status: "rejected",
      notes: rejection_reason ?? null,
    });

    // Audit (fire-and-forget)
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: "admin.verification.request_resubmission",
      entityType: "vendor_verification",
      entityId: id,
      targetUserId: vendor.id,
      ipAddress: ipFromRequest(req),
    });

    const resubContact = await getVendorContact();
    if (resubContact) {
      void sendResubmissionRequested(
        resubContact.email, resubContact.name, verif.type as string,
        notes ?? ""
      );
    }

    return NextResponse.json(data);
  }

  if (action === "flag") {
    await auth.db.from("vendors").update({
      suspicious_flag: true,
      suspicious_reason: suspicious_reason ?? null,
    }).eq("id", vendor.id);

    await auth.db.from("verification_activity_log").insert({
      vendor_id: vendor.id,
      verification_id: id,
      actor_id: auth.user.id,
      actor_type: "admin",
      action: "flagged",
      notes: suspicious_reason ?? null,
    });

    // Audit (fire-and-forget)
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: "admin.verification.flag",
      entityType: "vendor",
      entityId: vendor.id,
      ipAddress: ipFromRequest(req),
    });

    return NextResponse.json({ success: true });
  }

  if (action === "unflag") {
    await auth.db.from("vendors").update({
      suspicious_flag: false,
      suspicious_reason: null,
    }).eq("id", vendor.id);

    await auth.db.from("verification_activity_log").insert({
      vendor_id: vendor.id,
      verification_id: id,
      actor_id: auth.user.id,
      actor_type: "admin",
      action: "unflagged",
    });

    // Audit (fire-and-forget)
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: "admin.verification.unflag",
      entityType: "vendor",
      entityId: vendor.id,
      ipAddress: ipFromRequest(req),
    });

    return NextResponse.json({ success: true });
  }

  if (action === "set_level" && level !== undefined) {
    const { data: currentVendor } = await auth.db
      .from("vendors")
      .select("verification_level")
      .eq("id", vendor.id)
      .single();

    await auth.db.from("vendors").update({ verification_level: level }).eq("id", vendor.id);

    await auth.db.from("verification_activity_log").insert({
      vendor_id: vendor.id,
      verification_id: id,
      actor_id: auth.user.id,
      actor_type: "admin",
      action: level > (currentVendor?.verification_level ?? 0) ? "level_upgraded" : "level_downgraded",
      old_level: currentVendor?.verification_level ?? 0,
      new_level: level,
      notes: notes ?? null,
    });

    // Audit (fire-and-forget)
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: "admin.verification.set_level",
      entityType: "vendor_verification",
      entityId: id,
      targetUserId: vendor.id,
      after: { level },
      ipAddress: ipFromRequest(req),
    });

    if (level > (currentVendor?.verification_level ?? 0)) {
      const levelContact = await getVendorContact();
      if (levelContact) {
        void sendLevelUpgraded(levelContact.email, levelContact.name, level);
      }
    }

    return NextResponse.json({ success: true, level });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { vendor_id, type } = await req.json() as { vendor_id: string; type: string };
  if (!vendor_id || !type) return NextResponse.json({ error: "vendor_id and type required" }, { status: 400 });

  const { data, error } = await auth.db
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
