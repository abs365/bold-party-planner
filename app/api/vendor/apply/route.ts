import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ ...RATE_LIMITS.auth, limit: 5, windowMs: 60 * 60_000, identifier: `vendor_apply:${ip}` });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  const { user, supabase } = ctx;

  const body = await request.json() as {
    business_name: string;
    category: string;
    bio?: string;
    location?: string;
    city: string;
    travel_radius_km?: number;
    min_price?: number | null;
    max_price?: number | null;
    years_experience?: number | null;
    instagram_url?: string | null;
    website_url?: string | null;
  };

  if (!body.business_name || !body.category || !body.city) {
    return NextResponse.json({ error: "business_name, category, and city are required" }, { status: 400 });
  }

  // Update profile role to vendor
  await supabase.from("profiles").update({ role: "vendor" }).eq("id", user.id);

  // Insert vendor row
  const db = await createAdminClient();
  const { data: vendor, error } = await db
    .from("vendors")
    .insert({
      user_id: user.id,
      business_name: body.business_name,
      category: body.category,
      bio: body.bio || null,
      location: body.location || null,
      city: body.city,
      travel_radius_km: body.travel_radius_km ?? 30,
      min_price: body.min_price ?? null,
      max_price: body.max_price ?? null,
      years_experience: body.years_experience ?? null,
      instagram_url: body.instagram_url || null,
      website_url: body.website_url || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already have a vendor application." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch profile for email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Send welcome email — fire and forget
  if (profile?.email) {
    const { sendVendorApplicationReceived } = await import("@/lib/resend");
    void sendVendorApplicationReceived(
      profile.email,
      profile.full_name ?? body.business_name,
      body.business_name
    );
  }

  void track({
    event: "vendor.registered",
    userId: user.id,
    properties: { vendor_id: String(vendor.id), category: body.category, city: body.city },
  });

  return NextResponse.json({ success: true, vendor_id: vendor.id });
}
