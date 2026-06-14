import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  const identifier = ctx?.user.id ?? getClientIp(request);

  const rlHour = await rateLimit({ identifier: `vendor-apply:hr:${identifier}`, limit: 5, windowMs: 60 * 60_000 });
  const rlDay  = await rateLimit({ identifier: `vendor-apply:day:${identifier}`, limit: 20, windowMs: 24 * 60 * 60_000 });

  if (!rlHour.allowed || !rlDay.allowed) {
    const rl = !rlHour.allowed ? rlHour : rlDay;
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  if (!ctx) return unauthorized();

  const { user, supabase } = ctx;

  const body = await request.json() as {
    business_name: string;
    category: string;
    custom_category_description?: string | null;
    bio?: string;
    location?: string;
    city: string;
    phone: string;
    travel_radius_km?: number;
    min_price?: number | null;
    max_price?: number | null;
    years_experience?: number | null;
    instagram_url?: string | null;
    website_url?: string | null;
    portfolio_links?: Array<{ type: string; url: string }>;
  };

  if (!body.business_name || !body.category || !body.city || !body.phone) {
    return NextResponse.json({ error: "business_name, category, city, and phone are required" }, { status: 400 });
  }

  logger.info("vendor.apply.submit", { userId: user.id, category: body.category, city: body.city });

  // Update profile role to vendor in the profiles table
  await supabase.from("profiles").update({ role: "vendor" }).eq("id", user.id);

  // Keep user_metadata in sync so proxy.ts can route returning vendors correctly
  // without a DB round-trip. This is non-blocking — failure does not abort the application.
  void supabase.auth.updateUser({ data: { role: "vendor" } }).then(({ error }) => {
    if (error) logger.warn("vendor.apply.metadata_sync_failed", { userId: user.id, err: error });
  });

  const db = await createAdminClient();

  // For rejected vendors reapplying: update their existing row back to pending.
  // For first-time applicants: insert a new row.
  const { data: existingVendor } = await db
    .from("vendors")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  let vendor: { id: string; [key: string]: unknown };
  let error: { code: string; message: string } | null;

  const vendorPayload = {
    business_name: body.business_name,
    category: body.category,
    custom_category_description: body.category === "other" ? (body.custom_category_description || null) : null,
    bio: body.bio || null,
    location: body.location || "",
    city: body.city,
    phone: body.phone,
    travel_radius_km: body.travel_radius_km ?? 30,
    min_price: body.min_price ?? null,
    max_price: body.max_price ?? null,
    years_experience: body.years_experience ?? null,
    instagram_url: body.instagram_url || null,
    website_url: body.website_url || null,
    portfolio_links: body.portfolio_links ?? [],
    status: "pending",
    admin_notes: null,
    rejection_reason: null,
  };

  if (existingVendor && existingVendor.status === "rejected") {
    // Rejected vendor reapplying — reset their row
    const res = await db
      .from("vendors")
      .update(vendorPayload)
      .eq("id", existingVendor.id)
      .select()
      .single();
    vendor = res.data as typeof vendor;
    error = res.error as typeof error;
  } else if (existingVendor) {
    // Pending/approved/suspended — not a reapplication scenario
    if (existingVendor.status === "approved") {
      return NextResponse.json({ error: "Vendor already approved. Visit your dashboard." }, { status: 409 });
    }
    return NextResponse.json({ error: "You already have an active vendor application." }, { status: 409 });
  } else {
    const res = await db
      .from("vendors")
      .insert({ user_id: user.id, ...vendorPayload })
      .select()
      .single();
    vendor = res.data as typeof vendor;
    error = res.error as typeof error;
  }

  if (error) {
    logger.warn("vendor.apply.insert_failed", { userId: user.id, code: error.code, err: error });
    void supabase.from("profiles").update({ role: "customer" }).eq("id", user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("vendor.apply.created", { userId: user.id, vendorId: vendor.id, status: "pending" });

  // Fetch profile for email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.email) {
    const { sendVendorApplicationReceived, sendAdminNewVendorAlert } = await import("@/lib/resend");
    sendVendorApplicationReceived(profile.email, profile.full_name ?? body.business_name, body.business_name)
      .then((r) => { if (!r.success) logger.warn("vendor.apply.email_failed", { userId: user.id, error: r.error }); });

    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
    if (adminEmails.length > 0) {
      sendAdminNewVendorAlert(adminEmails, body.business_name, body.category, body.city, profile.email, vendor.id)
        .then((r) => { if (!r.success) logger.warn("vendor.apply.admin_alert_failed", { userId: user.id }); });
    } else {
      logger.warn("vendor.apply.no_admin_emails_configured", { userId: user.id, vendorId: vendor.id });
    }
  } else {
    logger.warn("vendor.apply.no_profile_email", { userId: user.id, vendorId: vendor.id });
  }

  void track({
    event: "vendor.registered",
    userId: user.id,
    properties: { vendor_id: String(vendor.id), category: body.category, city: body.city },
  });

  return NextResponse.json({ success: true, vendor_id: vendor.id }, {
    headers: {
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
      "X-RateLimit-Reset": String(Math.ceil(Math.min(rlHour.resetAt, rlDay.resetAt) / 1000)),
    },
  });
}
