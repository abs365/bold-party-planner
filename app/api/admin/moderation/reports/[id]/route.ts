import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  resolution_notes: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
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

  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole: "admin",
    action: parsed.data.status === "resolved" ? "admin.report.resolve" : "admin.report.dismiss",
    entityType: "content_report",
    entityId: id,
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ success: true });
}
