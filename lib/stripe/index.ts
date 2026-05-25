import Stripe from "stripe";

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export const PLATFORM_COMMISSION = 0.1; // 10%

export async function createPaymentIntent(
  amountGBP: number,
  metadata: Record<string, string>
) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: Math.round(amountGBP * 100),
    currency: "gbp",
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function createRefund(paymentIntentId: string, amountGBP?: number) {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amountGBP ? { amount: Math.round(amountGBP * 100) } : {}),
  });
}
