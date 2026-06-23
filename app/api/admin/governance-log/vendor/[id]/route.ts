import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { id } = await params;

  const { data, error } = await auth.db
    .from("governance_decisions")
    .select("*")
    .in("entity_type", ["vendor", "vendor_verification"])
    .eq("entity_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
