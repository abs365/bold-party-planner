import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type VendorConnectStatus = {
  id: string;
  status: string;
  stripe_connect_account_id: string | null;
  stripe_connect_status: string | null;
  stripe_connect_charges_enabled: boolean;
  stripe_connect_payouts_enabled: boolean;
  stripe_connect_details_submitted: boolean;
  stripe_connect_onboarded_at: string | null;
};

type OnboardingRow = {
  status: string;
  onboarding_url: string | null;
  onboarding_url_expires_at: string | null;
  requirements: Record<string, unknown> | null;
};

export async function GET() {
  if (process.env.STRIPE_CONNECT_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Vendor payout setup is not yet available. Check back soon." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendorRaw } = await supabase
    .from("vendors")
    .select(
      "id, status, stripe_connect_account_id, stripe_connect_status, " +
      "stripe_connect_charges_enabled, stripe_connect_payouts_enabled, " +
      "stripe_connect_details_submitted, stripe_connect_onboarded_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const vendor = vendorRaw as VendorConnectStatus | null;
  if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  // Fetch the latest onboarding row
  const { data: onboardingRaw } = await supabase
    .from("vendor_connect_onboarding")
    .select("status, onboarding_url, onboarding_url_expires_at, requirements")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const onboarding = onboardingRaw as OnboardingRow | null;

  let latestOnboarding: Record<string, unknown> | null = null;
  if (onboarding) {
    const urlExpired =
      !onboarding.onboarding_url_expires_at ||
      new Date(onboarding.onboarding_url_expires_at) <= new Date();

    latestOnboarding = {
      status:                 onboarding.status,
      onboardingUrl:          urlExpired ? null : onboarding.onboarding_url,
      onboardingUrlExpiresAt: onboarding.onboarding_url_expires_at,
      urlExpired,
      requirements:           onboarding.requirements,
    };
  }

  return NextResponse.json({
    status:           vendor.stripe_connect_status ?? null,
    chargesEnabled:   vendor.stripe_connect_charges_enabled ?? false,
    payoutsEnabled:   vendor.stripe_connect_payouts_enabled ?? false,
    detailsSubmitted: vendor.stripe_connect_details_submitted ?? false,
    onboardedAt:      vendor.stripe_connect_onboarded_at ?? null,
    latestOnboarding,
  });
}
