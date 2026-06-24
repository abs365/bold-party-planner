/**
 * Returns the Stripe secret key with bidirectional environment safety checks.
 *
 * Behaviour:
 *   - VERCEL_ENV=production: throws if the key is not a recognised live key
 *     (sk_live_* or rk_live_*). Live key required in production.
 *   - Everything else (local dev, GitHub Codespaces, Vercel preview): throws if
 *     the key IS a live key. Live keys create real GBP charges — only test keys
 *     (sk_test_* or rk_test_*) are permitted outside of production.
 *
 * VERCEL_ENV is injected by Vercel's build system and is absent in local dev and
 * GitHub Codespaces, making it the reliable signal for "real production".
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

  if (process.env.VERCEL_ENV === "production") {
    // Production: live key required
    if (!isLiveKey(key)) {
      throw new Error(
        `STRIPE_SECRET_KEY has an invalid or non-live prefix "${key.slice(0, 8)}..." ` +
          "in production deployment. Expected sk_live_... or rk_live_... " +
          "Check Stripe Dashboard → Developers → API Keys and update the Vercel environment variable."
      );
    }
  } else {
    // Non-production (local dev, Codespace, preview): live key blocked
    if (isLiveKey(key)) {
      throw new Error(
        `STRIPE_SECRET_KEY is a live key (${key.slice(0, 8)}...) but this is not a Vercel production ` +
          'deployment (VERCEL_ENV is not "production"). Live keys create real GBP charges. ' +
          "Use a test key (sk_test_* or rk_test_*) in local dev, GitHub Codespaces, and preview deployments.\n" +
          "Get a test key: Stripe Dashboard → Developers → API Keys → toggle Test mode."
      );
    }
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
