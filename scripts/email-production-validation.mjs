/**
 * ELBOLD Email Production Validation Script
 * Usage: RESEND_API_KEY=re_xxxx node scripts/email-production-validation.mjs
 *
 * Sends all 5 transactional email types to blue2gtv@gmail.com using the
 * production Resend API key and captures timestamps + API response IDs.
 *
 * Output: scripts/email-validation-results.json
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Resend } = require("resend");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = "blue2gtv@gmail.com";
const FROM = "ELBOLD <noreply@elbold.com>";
const APP_URL = "https://www.elbold.com";
const YEAR = new Date().getFullYear();

if (!RESEND_API_KEY || RESEND_API_KEY.startsWith("RESTORE_")) {
  console.error("ERROR: RESEND_API_KEY not set. Run:");
  console.error("  RESEND_API_KEY=re_xxxx node scripts/email-production-validation.mjs");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const results = {};

// ── HTML wrapper ─────────────────────────────────────────────────────────────
function wrap(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}
    body{font-family:Inter,-apple-system,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:20px 0}
    .container{max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
    .header{background:#0d1b3e;padding:28px 32px;text-align:center}
    .logo{font-size:22px;font-weight:800;color:#C9A84C;letter-spacing:2px;margin:0 0 4px}
    .logo-sub{color:rgba(201,168,76,0.65);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0}
    .header-sub{color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0}
    .body{padding:32px}
    .body p{color:#4b5563;font-size:15px;line-height:1.65;margin:0 0 16px}
    .btn{display:inline-block;background:#0d1b3e;color:white!important;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:8px 0 4px;border:2px solid #C9A84C}
    .detail-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:16px 0}
    .detail-box p{margin:5px 0;font-size:13px;color:#6b7280}
    .detail-label{color:#9ca3af}.detail-value{color:#111827;font-weight:600}
    .highlight{color:#0d1b3e;font-weight:700}
    .footer{padding:20px 32px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .footer-links{margin:0 0 12px}
    .footer-links a{color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px}
    .footer p{color:#9ca3af;font-size:11px;margin:0;line-height:1.5}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div class="logo">ELBOLD</div>
      <div class="logo-sub">Events</div>
      <p class="header-sub">${title}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <div class="footer-links">
        <a href="${APP_URL}">elbold.com</a>
        <a href="${APP_URL}/privacy">Privacy</a>
        <a href="${APP_URL}/terms">Terms</a>
        <a href="mailto:support@elbold.com">Support</a>
      </div>
      <p>&copy; ${YEAR} ELBOLD Ltd (trading as ELBOLD Events)<br>
      This email was sent because you have an account on ELBOLD Events.</p>
    </div>
  </div></body></html>`;
}

async function sendAndRecord(testId, testName, to, subject, html) {
  const ts = new Date().toISOString();
  console.log(`\n[${ts}] Triggering ${testId}: ${testName}`);
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`  ERROR: ${JSON.stringify(error)}`);
      results[testId] = { test: testName, timestamp: ts, sender: FROM, recipient: to, subject,
        resend_response: { error }, status: "SEND_FAILED" };
    } else {
      console.log(`  SUCCESS: email_id=${data.id}`);
      results[testId] = { test: testName, timestamp: ts, sender: FROM, recipient: to, subject,
        resend_response: { id: data.id, status: "sent" }, status: "TRIGGERED" };
    }
  } catch (err) {
    console.error(`  EXCEPTION: ${err.message}`);
    results[testId] = { test: testName, timestamp: ts, sender: FROM, recipient: to, subject,
      resend_response: { exception: err.message }, status: "EXCEPTION" };
  }
}

// ── TEST 1: Vendor Application Confirmation ──────────────────────────────────
await sendAndRecord(
  "T1_VENDOR_APPLICATION",
  "Vendor Application Confirmation",
  TO,
  "[VALIDATION TEST] Your application has been received | ELBOLD Events",
  wrap("Application Received", `
    <p>Hi Admin (Validation Test),</p>
    <p>We've received your vendor application for <span class="highlight">ELBOLD TEST Photography</span>. Our team reviews all applications within <strong>2 working days</strong> and will email you with the outcome.</p>
    <p>Once approved, your profile will go live on ELBOLD Events and you can start receiving enquiries immediately.</p>
    <p>In the meantime, you can log in to add more details to your profile, upload photos, and set up your packages.</p>
    <a href="${APP_URL}/vendor/dashboard" class="btn">Visit Your Dashboard</a>
    <p style="margin-top:24px">Welcome to ELBOLD Events!</p>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px">
      [VALIDATION EMAIL — Production delivery test 2026-06-10. Do not action.]</p>
  `)
);

// ── TEST 2: Customer Registration Confirmation ────────────────────────────────
await sendAndRecord(
  "T2_CUSTOMER_REGISTRATION",
  "Customer Registration Confirmation",
  TO,
  "[VALIDATION TEST] Welcome to ELBOLD Events — confirm your email",
  wrap("Welcome to ELBOLD Events!", `
    <p>Hi Admin (Validation Test),</p>
    <p>Thank you for creating an account on ELBOLD Events. Please confirm your email address to get started.</p>
    <div class="detail-box">
      <p><span class="detail-label">Account email:</span> <span class="detail-value">${TO}</span></p>
      <p><span class="detail-label">Account type:</span> <span class="detail-value">Customer</span></p>
    </div>
    <p>Once confirmed, you can browse thousands of verified event professionals, request free quotes, and book your perfect vendor in minutes.</p>
    <a href="${APP_URL}/dashboard" class="btn">Confirm Email Address</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">If you didn't create this account, you can ignore this email.</p>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px">
      [VALIDATION EMAIL — Production delivery test 2026-06-10. Do not action.]</p>
  `)
);

// ── TEST 3: Password Reset ────────────────────────────────────────────────────
// Note: Supabase Auth sends this directly. We test the Resend path here as a
// fallback in case Supabase uses default SMTP. This version simulates the
// platform's custom password reset notification pattern.
await sendAndRecord(
  "T3_PASSWORD_RESET",
  "Password Reset Confirmation",
  TO,
  "[VALIDATION TEST] Reset your ELBOLD password",
  wrap("Password Reset Request", `
    <p>Hi Admin (Validation Test),</p>
    <p>We received a request to reset the password for your ELBOLD Events account.</p>
    <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${APP_URL}/reset-password?token=VALIDATION_TEST_TOKEN" class="btn">Reset My Password</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px">
      [VALIDATION EMAIL — Production delivery test 2026-06-10. Do not action.]</p>
  `)
);

// ── TEST 4: Booking Confirmation ──────────────────────────────────────────────
await sendAndRecord(
  "T4_BOOKING_CONFIRMATION",
  "Booking Confirmation",
  TO,
  "[VALIDATION TEST] Payment confirmed: Deposit Payment for Birthday Party | ELBOLD Events",
  wrap("Deposit Payment Confirmed", `
    <p>Hi Admin (Validation Test),</p>
    <p>We've received your <span class="highlight">deposit payment</span> of <strong>&pound;1.00</strong> for <strong>RevVal2 Test Birthday Party</strong>.</p>
    <p>Your booking is now secured with REV TEST Photography. You can view your invoice and booking details below.</p>
    <div class="detail-box">
      <p><span class="detail-label">Booking ID:</span> <span class="detail-value">2e61b3ce-813e</span></p>
      <p><span class="detail-label">Vendor:</span> <span class="detail-value">REV TEST Photography</span></p>
      <p><span class="detail-label">Event:</span> <span class="detail-value">Birthday Party</span></p>
      <p><span class="detail-label">Event date:</span> <span class="detail-value">8 July 2026</span></p>
      <p><span class="detail-label">Deposit paid:</span> <span class="detail-value">&pound;1.00</span></p>
    </div>
    <a href="${APP_URL}/dashboard/bookings/2e61b3ce-813e-421d-8211-58043114b421" class="btn">View Booking</a>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px">
      [VALIDATION EMAIL — Production delivery test 2026-06-10. Do not action.]</p>
  `)
);

// ── TEST 5: Refund Confirmation ───────────────────────────────────────────────
await sendAndRecord(
  "T5_REFUND_CONFIRMATION",
  "Refund Confirmation",
  TO,
  "[VALIDATION TEST] Refund processed: RevVal2 Test Birthday Party | ELBOLD Events",
  wrap("Refund Processed", `
    <p>Hi Admin (Validation Test),</p>
    <p>A refund of <span class="highlight">&pound;1.00</span> for <strong>RevVal2 Test Birthday Party</strong> has been processed.</p>
    <p>It should appear in your account within 5&ndash;10 business days depending on your bank.</p>
    <div class="detail-box">
      <p><span class="detail-label">Booking ID:</span> <span class="detail-value">2e61b3ce-813e</span></p>
      <p><span class="detail-label">Refund amount:</span> <span class="detail-value">&pound;1.00</span></p>
      <p><span class="detail-label">Original charge:</span> <span class="detail-value">&pound;1.00 (deposit)</span></p>
      <p><span class="detail-label">Processing time:</span> <span class="detail-value">5&ndash;10 business days</span></p>
    </div>
    <p>If you have questions, contact <a href="mailto:support@elbold.com" style="color:#0d1b3e">support@elbold.com</a>.</p>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px">
      [VALIDATION EMAIL — Production delivery test 2026-06-10. Do not action.]</p>
  `)
);

// ── Output results ────────────────────────────────────────────────────────────
const { writeFileSync } = await import("fs");
const outPath = "scripts/email-validation-results.json";
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\n\nResults written to ${outPath}`);
console.log("\n=== SUMMARY ===");
for (const [id, r] of Object.entries(results)) {
  const status = r.status === "TRIGGERED" ? "TRIGGERED" : `FAILED (${r.resend_response?.error?.message || r.resend_response?.exception || "unknown"})`;
  console.log(`${id}: ${status}${r.resend_response?.id ? ` — email_id=${r.resend_response.id}` : ""}`);
}
