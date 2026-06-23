import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  if (vendor.stripe_connect_status !== "active") {
    return NextResponse.json(
      { error: "Payout dashboard is only available once your account is fully onboarded." },
      { status: 403 }
    );
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(assertStripeKey());

  let loginLink: import("stripe").Stripe.LoginLink;
  try {
    loginLink = await stripe.accounts.createLoginLink(vendor.stripe_connect_account_id as string);
  } catch (err) {
    console.error("[connect/dashboard] Stripe createLoginLink failed:", err);
    return NextResponse.json({ error: "Failed to generate dashboard link." }, { status: 500 });
  }

  return NextResponse.json({ url: loginLink.url });
}
