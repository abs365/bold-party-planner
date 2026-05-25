import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { status } = await req.json() as { status: string };

  const { data, error } = await supabase
    .from("vendor_onboarding")
    .upsert({ vendor_id: vendor.id, status, submitted_at: new Date().toISOString() }, { onConflict: "vendor_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data, error } = await supabase.from("vendor_onboarding").select("*").eq("vendor_id", vendor.id).single();
  if (error) return NextResponse.json(null);
  return NextResponse.json(data);
}
