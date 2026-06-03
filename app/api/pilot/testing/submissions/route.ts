import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Math.min(Number(searchParams.get("limit") ?? 500), 1000);

  const db = await createAdminClient();
  let query = db
    .from("pilot_test_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (type && ["customer", "vendor", "admin"].includes(type)) {
    query = query.eq("test_type", type);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
