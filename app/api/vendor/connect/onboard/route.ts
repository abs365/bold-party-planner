import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { assertStripeKey } from "@/lib/stripe";
import { appendLedgerEvent } from "@/lib/finance/ledger";
import { rateLimit } from "@/lib/rate-limit";

type VendorConnect = {
  id: string;
  user_id: string;
  status: string;
  stripe_connect_account_id: string | null;
  stripe_connect_status: string | null;
};

export async function POST(request: Request) {
  if (process.env.STRIPE_CONNECT_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Vendor payout setup is not yet available. Check back soon." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ identifier: `connect:onboard:${user.id}`, limit: 5, windowMs: 60 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again.", retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429 }
    );
  }

  const { data: vendorRaw } = await supabase
    .from("vendors")
    .select("id, user_id, status, stripe_connect_account_id, stripe_connect_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const vendor = vendorRaw as VendorConnect | null;
  if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
  if (vendor.status !== "approved") {
    return NextResponse.json(
      { error: "Payout setup is only available to approved vendors." },
      { status: 403 }
    );
  }
  if (vendor.stripe_connect_status === "active") {
    return NextResponse.json(
      { error: "Your payout account is already active.", accountId: vendor.stripe_connect_account_id },
      { status: 409 }
    );
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(assertStripeKey());

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL ?? "www.elbold.com"}`;
  const refreshUrl = `${appUrl}/vendor/payouts?refresh=1`;
  const returnUrl  = `${appUrl}/vendor/payouts?connected=1`;

  const admin = await createAdminClient();

  let accountId = vendor.stripe_connect_account_id;
  const isNewAccount = !accountId;

  if (isNewAccount) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
      ...(profile?.email ? { email: profile.email as string } : {}),
      business_type: "individual",
      metadata: {
        vendor_id:   vendor.id,
        elbold_env:  process.env.VERCEL_ENV ?? "development",
      },
    });

    accountId = account.id;

    const { error: vendorUpdateError } = await admin
      .from("vendors")
      .update({
        stripe_connect_account_id: accountId,
        stripe_connect_status:     "pending",
        lifecycle_state:           "connect_pending",
      })
      .eq("id", vendor.id);

    if (vendorUpdateError) {
      console.error("[connect/onboard] Failed to update vendor:", vendorUpdateError.message);
      return NextResponse.json({ error: "Failed to initialise payout account." }, { status: 500 });
    }
  }

  const { data: onboardingRow, error: insertError } = await admin
    .from("vendor_connect_onboarding")
    .insert({
      vendor_id:         vendor.id,
      stripe_account_id: accountId,
      refresh_url:       refreshUrl,
      return_url:        returnUrl,
      status:            "created",
    })
    .select("id")
    .single();

  if (insertError || !onboardingRow) {
    console.error("[connect/onboard] Failed to insert onboarding row:", insertError?.message);
    return NextResponse.json({ error: "Failed to create onboarding record." }, { status: 500 });
  }

  let accountLink: import("stripe").Stripe.AccountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account:     accountId as string,
      refresh_url: refreshUrl,
      return_url:  returnUrl,
      type:        "account_onboarding",
    });
  } catch (err) {
    console.error("[connect/onboard] Stripe accountLinks.create failed:", err);
    return NextResponse.json({ error: "Failed to generate onboarding link." }, { status: 500 });
  }

  const expiresAt = new Date(accountLink.expires_at * 1000).toISOString();

  await admin
    .from("vendor_connect_onboarding")
    .update({
      onboarding_url:            accountLink.url,
      onboarding_url_expires_at: expiresAt,
      status:                    "link_generated",
    })
    .eq("id", (onboardingRow as Record<string, string>).id);

  if (isNewAccount) {
    void appendLedgerEvent(
      admin,
      "CONNECT_ACCOUNT_CREATED",
      { vendor_id: vendor.id, stripe_account_id: accountId }
    );
  }

  return NextResponse.json({ url: accountLink.url, accountId, expiresAt });
}
