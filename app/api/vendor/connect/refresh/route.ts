import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { assertStripeKey } from "@/lib/stripe";

type VendorConnect = {
  id: string;
  stripe_connect_account_id: string | null;
  stripe_connect_status: string | null;
};

export async function POST() {
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
    .select("id, stripe_connect_account_id, stripe_connect_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const vendor = vendorRaw as VendorConnect | null;
  if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  if (!vendor.stripe_connect_account_id) {
    return NextResponse.json(
      { error: "No Connect account found. Please start onboarding first." },
      { status: 400 }
    );
  }

  if (vendor.stripe_connect_status === "active") {
    return NextResponse.json(
      { error: "Your payout account is already active. No refresh needed." },
      { status: 409 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL ?? "www.elbold.com"}`;
  const refreshUrl = `${appUrl}/vendor/payouts?refresh=1`;
  const returnUrl  = `${appUrl}/vendor/payouts?connected=1`;

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(assertStripeKey());

  let accountLink: import("stripe").Stripe.AccountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account:     vendor.stripe_connect_account_id,
      refresh_url: refreshUrl,
      return_url:  returnUrl,
      type:        "account_onboarding",
    });
  } catch (err) {
    console.error("[connect/refresh] Stripe accountLinks.create failed:", err);
    return NextResponse.json({ error: "Failed to generate onboarding link." }, { status: 500 });
  }

  const expiresAt = new Date(accountLink.expires_at * 1000).toISOString();

  // Update the latest onboarding row
  const admin = await createAdminClient();
  const { data: latestRowRaw } = await admin
    .from("vendor_connect_onboarding")
    .select("id")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestRow = latestRowRaw as { id: string } | null;
  if (latestRow) {
    await admin
      .from("vendor_connect_onboarding")
      .update({
        onboarding_url:            accountLink.url,
        onboarding_url_expires_at: expiresAt,
        status:                    "link_generated",
      })
      .eq("id", latestRow.id);
  }

  return NextResponse.json({ url: accountLink.url, expiresAt });
}
