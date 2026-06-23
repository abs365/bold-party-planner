import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";

const schema = z.object({
  moderation_status: z.enum(["approved", "rejected"]),
  flag_reason: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const update: Record<string, unknown> = {
    moderation_status: parsed.data.moderation_status,
    moderated_at: new Date().toISOString(),
    moderated_by: auth.user.id,
  };

  if (parsed.data.moderation_status === "rejected") {
    update.flagged_at = new Date().toISOString();
    update.flag_reason = parsed.data.flag_reason ?? "Rejected by admin";
    update.deleted_at = new Date().toISOString();
  }

  const { error } = await auth.db.from("vendor_media").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.role,
    action: parsed.data.moderation_status === "approved" ? "admin.media.approve" : "admin.media.reject",
    entityType: "vendor_media",
    entityId: id,
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ success: true });
}
