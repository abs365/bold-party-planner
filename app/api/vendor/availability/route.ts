import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  let vendorId = searchParams.get("vendor_id");

  // If no vendor_id, use the authenticated user's vendor (owner view)
  if (!vendorId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });
    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
    if (!vendor) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });
    vendorId = vendor.id as string;
  }

  let query = supabase
    .from("vendor_availability")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("is_available", false);

  if (month) {
    query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const body = await req.json() as { date: string; is_available: boolean; reason?: string };
  const { date, is_available, reason } = body;

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const { data, error } = await supabase
    .from("vendor_availability")
    .upsert({ vendor_id: vendor.id, date, is_available, notes: reason ?? null }, { onConflict: "vendor_id,date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { date } = await req.json() as { date: string };
  await supabase.from("vendor_availability").delete().eq("vendor_id", vendor.id).eq("date", date);
  return NextResponse.json({ success: true });
}
