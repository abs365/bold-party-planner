import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";

export async function GET(request: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = auth.db
    .from("profiles")
    .select("*, events:events(count), bookings:bookings(count)")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("full_name", `%${search}%`);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
