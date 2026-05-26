import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

const schema = z.object({
  moderation_status: z.enum(["approved", "rejected"]),
  flag_reason: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const update: Record<string, unknown> = {
    moderation_status: parsed.data.moderation_status,
    moderated_at: new Date().toISOString(),
    moderated_by: user.id,
  };

  if (parsed.data.moderation_status === "rejected") {
    update.flagged_at = new Date().toISOString();
    update.flag_reason = parsed.data.flag_reason ?? "Rejected by admin";
    update.deleted_at = new Date().toISOString();
  }

  const { error } = await supabase.from("vendor_media").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
