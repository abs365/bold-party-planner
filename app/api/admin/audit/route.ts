import { NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/auth/guards";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const entity_id    = searchParams.get("entity_id");
  const entity_type  = searchParams.get("entity_type");
  const actor_id     = searchParams.get("actor_id");
  const limit        = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  let query = auth.db
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entity_id)   query = query.eq("entity_id", entity_id);
  if (entity_type) query = query.eq("entity_type", entity_type);
  if (actor_id)    query = query.eq("user_id", actor_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
