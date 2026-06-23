import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";

export async function GET(request: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const entity_type  = searchParams.get("entity_type");
  const action_type  = searchParams.get("action_type");
  const actor_id     = searchParams.get("actor_id");
  const entity_id    = searchParams.get("entity_id");
  const from_date    = searchParams.get("from_date");
  const to_date      = searchParams.get("to_date");
  const automated    = searchParams.get("automated");
  const limit        = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  let query = auth.db
    .from("governance_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entity_type)  query = query.eq("entity_type", entity_type);
  if (action_type)  query = query.eq("action_type", action_type);
  if (actor_id)     query = query.eq("actor_user_id", actor_id);
  if (entity_id)    query = query.eq("entity_id", entity_id);
  if (from_date)    query = query.gte("created_at", from_date);
  if (to_date)      query = query.lte("created_at", to_date);
  if (automated === "true")  query = query.eq("is_automated", true);
  if (automated === "false") query = query.eq("is_automated", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
