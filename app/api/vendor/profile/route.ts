import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tryUpgradeLevel1 } from "@/lib/verification-automation";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const allowed = [
    "business_name", "tagline", "bio", "category", "city", "address",
    "phone", "website_url", "instagram_url", "min_price", "max_price",
    "years_experience", "event_types",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (!updates.business_name || String(updates.business_name).trim() === "") {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  if (!updates.category) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vendors")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check level 1 eligibility after profile update (fire-and-forget)
  if (data.verification_level === 0) {
    void tryUpgradeLevel1(data.id, user.id, supabase);
  }

  return NextResponse.json(data);
}
