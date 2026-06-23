import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { assertConnectWebhookSecret } from "@/lib/stripe";
import { appendLedgerEvent } from "@/lib/finance/ledger";
import type { FinancialEventType } from "@/lib/finance/ledger";

export const runtime = "nodejs";

type VendorConnectRow = {
  id: string;
  user_id: string;
  stripe_connect_payouts_enabled: boolean;
  stripe_connect_charges_enabled: boolean;
};

export async function POST(request: Request) {
  // Connect webhook is NOT kill-switch gated — must always accept events to prevent
  // Stripe from exhausting retries. Log a warning if Connect is disabled.
  if (process.env.STRIPE_CONNECT_ENABLED !== "true") {
    console.warn("[connect-webhook] Received event while STRIPE_CONNECT_ENABLED is not 'true'. Processing anyway.");
  }

  const body = await request.text();
  const sig  = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: import("stripe").Stripe.Event;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "placeholder");
    event = stripe.webhooks.constructEvent(body, sig, assertConnectWebhookSecret());
  } catch (err) {
    console.error("[connect-webhook] Signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // ── Atomic idempotency check ──────────────────────────────────────────────
  const { error: dupError } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });

  if (dupError) {
    if (dupError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[connect-webhook] Failed to record stripe event:", dupError);
    return NextResponse.json({ error: "Event recording failed" }, { status: 500 });
  }

  // ── Handle account.updated ────────────────────────────────────────────────
  if (event.type === "account.updated") {
    const account = event.data.object as import("stripe").Stripe.Account;
    const stripeAccountId = (event.account ?? account.id) as string;

    // Fetch current vendor state to detect active→active vs pending→active transition
    const { data: vendorRaw } = await admin
      .from("vendors")
      .select("id, user_id, stripe_connect_payouts_enabled, stripe_connect_charges_enabled")
      .eq("stripe_connect_account_id", stripeAccountId)
      .maybeSingle();

    const vendor = vendorRaw as VendorConnectRow | null;
    if (!vendor) {
      console.warn("[connect-webhook] account.updated for unknown account:", stripeAccountId);
      return NextResponse.json({ received: true });
    }

    // Derive new Connect status
    let newStatus: "pending" | "restricted" | "active" | "disabled";
    if (!account.details_submitted) {
      newStatus = "pending";
    } else if (account.requirements?.disabled_reason) {
      newStatus = "disabled";
    } else if (account.charges_enabled && account.payouts_enabled) {
      newStatus = "active";
    } else {
      newStatus = "restricted";
    }

    const wasActive = Boolean(vendor.stripe_connect_payouts_enabled && vendor.stripe_connect_charges_enabled);
    const isNowActive = Boolean(account.charges_enabled && account.payouts_enabled);
    const isNewlyActive = isNowActive && !wasActive;

    const vendorUpdates: Record<string, unknown> = {
      stripe_connect_status:            newStatus,
      stripe_connect_details_submitted: account.details_submitted ?? false,
      stripe_connect_charges_enabled:   account.charges_enabled ?? false,
      stripe_connect_payouts_enabled:   account.payouts_enabled ?? false,
    };
    if (isNewlyActive) {
      vendorUpdates.stripe_connect_onboarded_at = new Date().toISOString();
      vendorUpdates.lifecycle_state = "payout_ready";
    }

    const { error: vendorUpdateError } = await admin
      .from("vendors")
      .update(vendorUpdates)
      .eq("id", vendor.id);

    if (vendorUpdateError) {
      console.error("[connect-webhook] Failed to update vendor:", vendorUpdateError.message);
    }

    // Update latest vendor_connect_onboarding row
    const { data: latestOnboardingRaw } = await admin
      .from("vendor_connect_onboarding")
      .select("id")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestOnboarding = latestOnboardingRaw as { id: string } | null;
    if (latestOnboarding) {
      const onboardingUpdates: Record<string, unknown> = {
        requirements: account.requirements ?? null,
      };
      if (isNewlyActive) {
        onboardingUpdates.status = "completed";
      }
      await admin
        .from("vendor_connect_onboarding")
        .update(onboardingUpdates)
        .eq("id", latestOnboarding.id);
    }

    // Append financial event
    let financialEventType: FinancialEventType;
    if (isNewlyActive) {
      financialEventType = "CONNECT_ACCOUNT_ACTIVATED";
    } else if (newStatus === "restricted") {
      financialEventType = "CONNECT_ACCOUNT_RESTRICTED";
    } else if (newStatus === "disabled") {
      financialEventType = "CONNECT_ACCOUNT_DISABLED";
    } else {
      financialEventType = "CONNECT_ACCOUNT_UPDATED";
    }

    void appendLedgerEvent(admin, financialEventType, {
      vendor_id:         vendor.id,
      stripe_account_id: stripeAccountId,
      charges_enabled:   account.charges_enabled,
      payouts_enabled:   account.payouts_enabled,
      status:            newStatus,
    });

    // Notify vendor if newly active
    if (isNewlyActive) {
      void admin.rpc("notify_user", {
        p_user_id: vendor.user_id,
        p_title:   "Payout Account Ready",
        p_message: "Your payout account has been verified and is ready to receive payments.",
        p_type:    "payment",
        p_link:    "/vendor/payouts",
      });
    }
  }

  return NextResponse.json({ received: true });
}
