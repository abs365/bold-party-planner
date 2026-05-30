/**
 * Returns the Stripe secret key with environment safety checks.
 *
 * Behaviour:
 *   - VERCEL_ENV=production (main domain): throws if the key is a test key (sk_test_)
 *   - VERCEL_ENV=preview (PR/branch deploy): warns but allows test keys for E2E testing
 *   - Local dev (NODE_ENV=development): always allows test keys silently
 *
 * VERCEL_ENV is set automatically by Vercel and is never 'production' in local dev,
 * so the production guard only fires on the real production deployment.
 */
export function assertStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
  }

  const isProductionDeploy =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production";

  const isPreviewDeploy =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "preview";

  if (isProductionDeploy && key.startsWith("sk_test_")) {
    throw new Error(
      "Stripe test key (sk_test_...) detected in production deployment. " +
        "Set STRIPE_SECRET_KEY to your live key (sk_live_...) in Vercel production environment variables."
    );
  }

  if (isPreviewDeploy && key.startsWith("sk_test_")) {
    console.warn(
      "[stripe] Warning: Using a test key in a Vercel preview deployment. " +
        "This is allowed for staging/E2E use. Do not promote this environment variable to production."
    );
  }

  return key;
}

/**
 * Returns the Stripe webhook signing secret.
 * Throws if the environment variable is missing in any environment.
 */
export function assertWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set.");
  }
  return secret;
}
