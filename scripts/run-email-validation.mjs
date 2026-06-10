/**
 * ELBOLD Email Production Validation — Calling Script
 *
 * Flow:
 *  1. Use Supabase Admin API to generate a magic link for the admin account
 *  2. Exchange the OTP for a Supabase session (access_token) — no email required
 *  3. Call the production validation endpoint with the Bearer token
 *  4. Print and save the full results
 *
 * Run AFTER deploying the validation endpoint to production:
 *   node scripts/run-email-validation.mjs
 *
 * No API keys are exposed, logged, or stored by this script.
 * All values come from .env.local (not committed to Git).
 */

import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

// ── Read from .env.local (local only — not Git) ───────────────────────────────
function loadEnv(filePath) {
  try {
    const lines = readFileSync(filePath, "utf8").split("\n");
    const env = {};
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

const localEnv = loadEnv(".env.local");

const SUPABASE_URL = localEnv.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = localEnv.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (localEnv.ADMIN_EMAILS ?? "").split(",")[0].trim();
const PRODUCTION_URL = "https://www.elbold.com";
const ENDPOINT = `${PRODUCTION_URL}/api/admin/email-validation`;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE) {
  console.error("ERROR: Missing Supabase env vars in .env.local");
  process.exit(1);
}
if (!ADMIN_EMAIL) {
  console.error("ERROR: ADMIN_EMAILS not set in .env.local");
  process.exit(1);
}

console.log(`\nELBOLD Email Production Validation`);
console.log(`Admin account: ${ADMIN_EMAIL}`);
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`─────────────────────────────────────\n`);

// ── Step 1: Generate magic link + OTP via Supabase Admin API ─────────────────
console.log("Step 1: Generating admin session via Supabase Admin API...");
const genResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: {
    "apikey": SUPABASE_SERVICE_ROLE,
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ type: "magiclink", email: ADMIN_EMAIL }),
});

if (!genResp.ok) {
  const err = await genResp.text();
  console.error(`ERROR: generate_link failed — HTTP ${genResp.status}: ${err}`);
  process.exit(1);
}

const genData = await genResp.json();
const emailOtp = genData.email_otp;

if (!emailOtp) {
  console.error("ERROR: No email_otp in generate_link response");
  console.error("Response:", JSON.stringify(genData, null, 2));
  process.exit(1);
}

console.log(`  ✓ Magic link generated (OTP: ${emailOtp.slice(0, 2)}****)`);

// ── Step 2: Exchange OTP for access_token ────────────────────────────────────
console.log("Step 2: Exchanging OTP for Supabase session...");
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
  email: ADMIN_EMAIL,
  token: emailOtp,
  type: "magiclink",
});

if (sessionError || !sessionData?.session?.access_token) {
  console.error(`ERROR: verifyOtp failed — ${sessionError?.message ?? "no session returned"}`);
  process.exit(1);
}

const accessToken = sessionData.session.access_token;
console.log(`  ✓ Admin session obtained (user: ${sessionData.user?.email})`);

// ── Step 3: Call the production validation endpoint ───────────────────────────
console.log(`Step 3: Calling production validation endpoint...`);
const startTs = new Date().toISOString();
const validResp = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
});

const httpStatus = validResp.status;
const body = await validResp.text();

let validData;
try {
  validData = JSON.parse(body);
} catch {
  console.error(`ERROR: Endpoint returned non-JSON — HTTP ${httpStatus}`);
  console.error("Body:", body.slice(0, 500));
  process.exit(1);
}

if (!validResp.ok) {
  console.error(`ERROR: Endpoint returned HTTP ${httpStatus}`);
  console.error("Response:", JSON.stringify(validData, null, 2));
  process.exit(1);
}

// ── Step 4: Print results ─────────────────────────────────────────────────────
console.log(`\n✓ Validation complete — HTTP ${httpStatus}`);
console.log(`  Run timestamp: ${validData.validation_run}`);
console.log(`  Caller: ${validData.caller}`);
console.log(`  Recipient: ${validData.recipient}`);
console.log(`  Overall: ${validData.overall_status}\n`);

console.log("─── Results ───────────────────────────────────────────");
for (const [id, r] of Object.entries(validData.results ?? {})) {
  const result = r;
  const status = result.status === "TRIGGERED" ? "✓ TRIGGERED" : `✗ FAILED`;
  const resendId = result.resend_response?.id ?? result.resend_response?.error ?? "—";
  console.log(`${id}: ${status}`);
  console.log(`  Timestamp: ${result.timestamp}`);
  console.log(`  Resend response: ${JSON.stringify(result.resend_response)}`);
  console.log(`  Resend ID: ${resendId}`);
  console.log();
}

// ── Step 5: Save results ──────────────────────────────────────────────────────
const outPath = "scripts/email-validation-results.json";
writeFileSync(outPath, JSON.stringify({ ...validData, http_status: httpStatus, call_timestamp: startTs }, null, 2));
console.log(`Results saved to ${outPath}`);
