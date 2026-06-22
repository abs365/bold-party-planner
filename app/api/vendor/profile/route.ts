import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tryUpgradeLevel1 } from "@/lib/verification-automation";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendorCheck } = await supabase
    .from("vendors")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendorCheck) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  if (vendorCheck.status === "suspended") {
    return NextResponse.json({ error: "Your account has been suspended" }, { status: 403 });
  }
  if (vendorCheck.status === "rejected") {
    return NextResponse.json({ error: "Your application was not approved" }, { status: 403 });
  }
  // pending and approved vendors may both update their profile

  const body = await req.json();

  const allowed = [
    "business_name", "tagline", "bio", "category", "custom_category_description", "city", "address",
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
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  // Audit + analytics (fire-and-forget)
  void createAuditLog({
    actorUserId: user.id,
    actorRole: "vendor",
    action: "vendor.profile.update",
    entityType: "vendor",
    entityId: data.id,
    ipAddress: ipFromRequest(req),
  });
  void track({ event: "vendor.onboarding.step_completed", userId: user.id, properties: { step: "profile" } });

  // Check level 1 eligibility after profile update (fire-and-forget)
  if (data.verification_level === 0) {
    void tryUpgradeLevel1(data.id, user.id, supabase);
  }

  return NextResponse.json(data);
}
