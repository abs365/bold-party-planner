/**
 * Returns the Stripe secret key with environment safety checks.
 *
 * Behaviour:
 *   - VERCEL_ENV=production: throws if the key is a test key OR if the prefix is
 *     not a recognised Stripe secret-key format (sk_live_, rk_live_).
 *   - VERCEL_ENV=preview: warns but allows test keys for E2E testing.
 *   - Local dev (NODE_ENV=development): logs a warning for non-standard key formats
 *     but never blocks, so local development with placeholder keys still works.
 *
 * VERCEL_ENV is set automatically by Vercel and is never 'production' in local dev,
 * so the production guard only fires on the real production deployment.
 *
 * Recognised Stripe key prefixes:
 *   sk_live_  — live secret key
 *   sk_test_  — test secret key
 *   rk_live_  — live restricted key
 *   rk_test_  — test restricted key
 */

const VALID_LIVE_PREFIXES = ["sk_live_", "rk_live_"];
const VALID_TEST_PREFIXES = ["sk_test_", "rk_test_"];
const ALL_VALID_PREFIXES  = [...VALID_LIVE_PREFIXES, ...VALID_TEST_PREFIXES];

function hasValidStripePrefix(key: string): boolean {
  return ALL_VALID_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isLiveKey(key: string): boolean {
  return VALID_LIVE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

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

  if (isProductionDeploy) {
    if (!isLiveKey(key)) {
      throw new Error(
        `STRIPE_SECRET_KEY has an invalid or non-live prefix "${key.slice(0, 8)}..." ` +
          "in production deployment. Expected sk_live_... or rk_live_... " +
          "Check Stripe Dashboard → Developers → API Keys and update the Vercel environment variable."
      );
    }
  } else if (isPreviewDeploy) {
    if (!hasValidStripePrefix(key)) {
      console.warn(
        `[stripe] WARNING: STRIPE_SECRET_KEY has an unrecognised prefix "${key.slice(0, 8)}...". ` +
          "Expected sk_live_*, sk_test_*, rk_live_*, or rk_test_*. " +
          "Verify the key in Stripe Dashboard → Developers → API Keys."
      );
    } else if (!VALID_TEST_PREFIXES.some((p) => key.startsWith(p))) {
      console.warn(
        "[stripe] Warning: Using a live key in a Vercel preview deployment. " +
          "Consider using a test key for staging/E2E to avoid real charges."
      );
    }
  } else {
    // Local dev
    if (!hasValidStripePrefix(key)) {
      console.warn(
        `[stripe] WARNING: STRIPE_SECRET_KEY has an unrecognised prefix "${key.slice(0, 8)}...". ` +
          "Expected sk_live_*, sk_test_*, rk_live_*, or rk_test_*. " +
          "Stripe API calls will fail with authentication errors until a valid key is set."
      );
    }
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

/**
 * Returns the Stripe Connect webhook signing secret.
 * This is a separate secret from the platform webhook — each endpoint in Stripe Dashboard
 * has its own signing secret. Using the wrong secret causes all signature verifications to fail.
 */
export function assertConnectWebhookSecret(): string {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_CONNECT_WEBHOOK_SECRET environment variable is not set.");
  }
  return secret;
}
