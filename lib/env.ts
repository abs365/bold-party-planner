/**
 * Central environment variable validation.
 * Call validateEnv() in server-side startup paths to catch missing config early.
 * All getters throw clearly if the variable is missing so errors surface at the
 * call site, not deep inside a Stripe/Resend/OpenAI SDK.
 */

type EnvVar = {
  value: string | undefined;
  required: boolean;
  description: string;
};

const SERVER_ENV: Record<string, EnvVar> = {
  SUPABASE_SERVICE_ROLE_KEY: {
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    required: true,
    description: "Supabase service role key for admin DB operations",
  },
  STRIPE_SECRET_KEY: {
    value: process.env.STRIPE_SECRET_KEY,
    required: true,
    description: "Stripe secret key for payment processing",
  },
  STRIPE_WEBHOOK_SECRET: {
    value: process.env.STRIPE_WEBHOOK_SECRET,
    required: true,
    description: "Stripe webhook signing secret",
  },
  STRIPE_PRO_PRICE_ID: {
    value: process.env.STRIPE_PRO_PRICE_ID,
    required: false,
    description: "Stripe price ID for Pro subscription plan",
  },
  STRIPE_FEATURED_PRICE_ID: {
    value: process.env.STRIPE_FEATURED_PRICE_ID,
    required: false,
    description: "Stripe price ID for Featured subscription plan",
  },
  RESEND_API_KEY: {
    value: process.env.RESEND_API_KEY,
    required: true,
    description: "Resend API key for transactional emails",
  },
  OPENAI_API_KEY: {
    value: process.env.OPENAI_API_KEY,
    required: true,
    description: "OpenAI API key for Smart Planner and Concierge",
  },
  ADMIN_EMAILS: {
    value: process.env.ADMIN_EMAILS,
    required: true,
    description: "Comma-separated admin email addresses",
  },
  NEXT_PUBLIC_APP_URL: {
    value: process.env.NEXT_PUBLIC_APP_URL,
    required: true,
    description: "Public app URL (e.g. https://boldparty.co.uk)",
  },
};

const PUBLIC_ENV: Record<string, EnvVar> = {
  NEXT_PUBLIC_SUPABASE_URL: {
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    required: true,
    description: "Supabase project URL",
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    required: true,
    description: "Supabase anonymous public key",
  },
};

/**
 * Validates all environment variables. Logs warnings for missing optional vars
 * and throws for missing required vars. Safe to call multiple times.
 */
export function validateEnv() {
  const allVars = { ...SERVER_ENV, ...PUBLIC_ENV };
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [name, { value, required, description }] of Object.entries(allVars)) {
    if (!value || value.trim() === "") {
      if (required) {
        missing.push(`  ❌ ${name} — ${description}`);
      } else {
        warnings.push(`  ⚠️  ${name} — ${description} (optional)`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`[Bold Party] Optional env vars not set:\n${warnings.join("\n")}`);
  }

  if (missing.length > 0) {
    const msg = `[Bold Party] Missing required environment variables:\n${missing.join("\n")}\n\nSee DEPLOYMENT_GUIDE.md for setup instructions.`;
    if (process.env.NODE_ENV === "production") {
      // In production, crash loudly so the issue is impossible to miss
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }
}

// ── Typed getters — throw with a clear message if var is missing ──────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Bold Party] Environment variable ${name} is required but not set. ` +
      `See DEPLOYMENT_GUIDE.md for setup instructions.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  supabaseServiceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseUrl: () => requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  stripeSecretKey: () => requireEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => requireEnv("STRIPE_WEBHOOK_SECRET"),
  stripeProPriceId: () => optionalEnv("STRIPE_PRO_PRICE_ID"),
  stripeFeaturedPriceId: () => optionalEnv("STRIPE_FEATURED_PRICE_ID"),
  resendApiKey: () => requireEnv("RESEND_API_KEY"),
  openaiApiKey: () => requireEnv("OPENAI_API_KEY"),
  appUrl: () => optionalEnv("NEXT_PUBLIC_APP_URL", "https://boldparty.co.uk"),
  adminEmails: () => optionalEnv("ADMIN_EMAILS", "").split(",").map((e) => e.trim()).filter(Boolean),
  isProduction: () => process.env.NODE_ENV === "production",
  isDevelopment: () => process.env.NODE_ENV === "development",
} as const;
