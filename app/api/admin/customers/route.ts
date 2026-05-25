import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const adminSupabase = await createAdminClient();
  let query = adminSupabase
    .from("profiles")
    .select("*, events:events(count), bookings:bookings(count)")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("full_name", `%${search}%`);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
