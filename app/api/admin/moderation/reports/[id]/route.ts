import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { createGovernanceDecision } from "@/lib/governance";

const schema = z.object({
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  resolution_notes: z.string().max(1000).optional(),
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
    status: parsed.data.status,
    resolved_by: auth.user.id,
    resolved_at: new Date().toISOString(),
  };
  if (parsed.data.resolution_notes) update.resolution_notes = parsed.data.resolution_notes;

  const { error } = await auth.db.from("content_reports").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ip = ipFromRequest(req);
  const isResolved = parsed.data.status === "resolved";

  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.role,
    action: isResolved ? "admin.report.resolve" : "admin.report.dismiss",
    entityType: "content_report",
    entityId: id,
    ipAddress: ip,
  });

  void createGovernanceDecision({
    actorUserId: auth.user.id,
    actorEmail:  auth.user.email ?? "",
    actorRole:   auth.role,
    actionType:  isResolved ? "dispute.resolved" : "dispute.dismissed",
    entityType:  "dispute",
    entityId:    id,
    newStatus:   parsed.data.status,
    adminNotes:  parsed.data.resolution_notes,
    ipAddress:   ip,
  });

  return NextResponse.json({ success: true });
}
