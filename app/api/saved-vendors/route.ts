import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { track } from "@/lib/analytics";

// GET /api/saved-vendors?vendor_id=xxx — check if vendor is saved
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendor_id = searchParams.get("vendor_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: false });

  if (vendor_id) {
    const { data } = await supabase
      .from("saved_vendors")
      .select("id")
      .eq("customer_id", user.id)
      .eq("vendor_id", vendor_id)
      .maybeSingle();
    return NextResponse.json({ saved: !!data });
  }

  const { data } = await supabase
    .from("saved_vendors")
    .select("vendor_id")
    .eq("customer_id", user.id);

  return NextResponse.json({ vendor_ids: (data ?? []).map((s) => s.vendor_id) });
}

// POST /api/saved-vendors — toggle save/unsave
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vendor_id } = await req.json() as { vendor_id?: string };
  if (!vendor_id) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("saved_vendors")
    .select("id")
    .eq("customer_id", user.id)
    .eq("vendor_id", vendor_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_vendors").delete().eq("id", existing.id);
    void track({ event: "marketplace.vendor_unsaved", userId: user.id, properties: { vendor_id } });
    return NextResponse.json({ saved: false });
  }

  await supabase.from("saved_vendors").insert({ customer_id: user.id, vendor_id });
  void track({ event: "marketplace.vendor_saved", userId: user.id, properties: { vendor_id } });
  return NextResponse.json({ saved: true });
}
