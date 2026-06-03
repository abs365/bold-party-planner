import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth/guards";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  const { role } = await request.json() as { role?: string };
  if (role !== "customer" && role !== "vendor") {
    return NextResponse.json({ error: "role must be customer or vendor" }, { status: 400 });
  }

  const { user, supabase } = ctx;

  const [profileResult, metaResult] = await Promise.all([
    supabase.from("profiles").update({ role }).eq("id", user.id),
    supabase.auth.updateUser({ data: { role } }),
  ]);

  if (profileResult.error) {
    logger.warn("auth.set-role.profile_failed", { userId: user.id, role, err: profileResult.error });
  }
  if (metaResult.error) {
    logger.warn("auth.set-role.metadata_failed", { userId: user.id, role, err: metaResult.error });
  }

  logger.info("auth.set-role.done", { userId: user.id, role });
  return NextResponse.json({ success: true, role });
}
