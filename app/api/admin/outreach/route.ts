import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import {
  sendFoundingVendorWelcome,
  sendVerificationReminder,
  sendPackageCompletionReminder,
  sendProfileCompletionReminder,
} from "@/lib/resend/vendor-outreach";
import { computeVendorReadinessScore } from "@/lib/vendor/completion";

const EMAIL_TYPES = ["welcome", "verification", "packages", "profile"] as const;
type EmailType = typeof EMAIL_TYPES[number];

export async function POST(request: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const body = await request.json() as { vendor_id?: string; email_type?: string };
  const { vendor_id, email_type } = body;

  if (!vendor_id || !email_type) {
    return NextResponse.json({ error: "vendor_id and email_type required" }, { status: 400 });
  }
  if (!EMAIL_TYPES.includes(email_type as EmailType)) {
    return NextResponse.json({ error: `email_type must be one of: ${EMAIL_TYPES.join(", ")}` }, { status: 400 });
  }

  const { data: vendor, error } = await auth.db
    .from("vendors")
    .select("*, media:vendor_media(*), packages:vendor_packages(*), profile:profiles(full_name, email)")
    .eq("id", vendor_id)
    .maybeSingle();

  if (error || !vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const profile = vendor.profile as { full_name?: string; email?: string } | null;
  const to = profile?.email;
  const name = (profile?.full_name ?? (vendor.business_name as string)).split(" ")[0];
  const businessName = String(vendor.business_name);

  if (!to) {
    return NextResponse.json({ error: "Vendor has no email address" }, { status: 422 });
  }

  const mediaArr = vendor.media as Array<{ is_cover?: boolean }> | null;
  const pkgArr = vendor.packages as Array<Record<string, unknown>> | null;
  const bio = (vendor.bio as string | null | undefined) ?? "";
  const verificationLevel = Number(vendor.verification_level ?? 0);

  let result: { success: boolean; error?: string };

  if (email_type === "welcome") {
    result = await sendFoundingVendorWelcome(to, name, businessName);

  } else if (email_type === "verification") {
    const missing: string[] = [];
    if (!vendor.phone) missing.push("Phone number not provided");
    else if (!vendor.phone_verified) missing.push("Phone number not verified");
    if (verificationLevel < 2) missing.push("Government ID not submitted or approved");
    if (verificationLevel < 3) missing.push("Proof of address not submitted or approved");
    if (missing.length === 0) {
      return NextResponse.json({ error: "Vendor already fully verified — no reminder needed" }, { status: 422 });
    }
    result = await sendVerificationReminder(to, name, businessName, missing);

  } else if (email_type === "packages") {
    if ((pkgArr?.length ?? 0) >= 1) {
      return NextResponse.json({ error: "Vendor already has packages" }, { status: 422 });
    }
    result = await sendPackageCompletionReminder(to, name, businessName);

  } else {
    // profile completion reminder
    const score = computeVendorReadinessScore({
      mediaCount:        mediaArr?.length ?? 0,
      packageCount:      pkgArr?.length ?? 0,
      verificationLevel,
      bioLength:         bio.trim().length,
      hasPhone:          !!(vendor.phone as string | null),
      hasCity:           !!(vendor.city as string | null),
      hasSocial:         !!(vendor.instagram_url || vendor.website_url),
      responseRate:      Number(vendor.response_rate ?? 0),
    });

    let nextAction = "Complete your profile to attract more enquiries";
    let nextHref = "/vendor/dashboard";
    if ((mediaArr?.length ?? 0) < 3) { nextAction = "Upload at least 3 portfolio photos — vendors with photos get 5x more enquiries"; nextHref = "/vendor/media"; }
    else if ((pkgArr?.length ?? 0) === 0) { nextAction = "Create your first service package so customers can request quotes"; nextHref = "/vendor/services"; }
    else if (bio.trim().length < 50) { nextAction = "Write a bio of 50+ characters describing your services and experience"; nextHref = "/vendor/profile"; }
    else if (verificationLevel < 2) { nextAction = "Submit a government ID to earn your Verified badge"; nextHref = "/vendor/verification"; }

    result = await sendProfileCompletionReminder(to, name, businessName, score.total, nextAction, nextHref);
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Email send failed" }, { status: 500 });
  }

  console.info("[outreach]", { admin: auth.user.id, vendor_id, email_type, to });

  return NextResponse.json({ success: true, email_type, to });
}
