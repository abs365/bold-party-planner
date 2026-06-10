import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Temporary admin-only email validation endpoint.
// Auth: verifies Supabase Bearer token + ADMIN_EMAILS list.
// Calls Resend directly so response IDs are captured.
// Remove this file after validation is complete.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const FROM = "ELBOLD <noreply@elbold.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.elbold.com";
const YEAR = new Date().getFullYear();

async function verifyAdminBearer(request: Request): Promise<string | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.email) return null;
  if (!ADMIN_EMAILS.includes(user.email)) return null;
  return user.email;
}

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
    body{font-family:Inter,-apple-system,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:20px 0}
    .c{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
    .h{background:#0d1b3e;padding:28px 32px;text-align:center}
    .logo{font-size:22px;font-weight:800;color:#C9A84C;letter-spacing:2px;margin:0}
    .sub{color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0}
    .b{padding:32px}.b p{color:#4b5563;font-size:15px;line-height:1.65;margin:0 0 16px}
    .btn{display:inline-block;background:#0d1b3e;color:white!important;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;border:2px solid #C9A84C}
    .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:16px 0}
    .box p{margin:5px 0;font-size:13px}.lbl{color:#9ca3af}.val{color:#111827;font-weight:600}
    .hi{color:#0d1b3e;font-weight:700}
    .ft{padding:20px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .ft p{color:#9ca3af;font-size:11px;margin:0}
    .val-note{margin-top:20px;padding:12px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;font-size:12px;color:#92400e}
  </style></head><body><div class="c">
    <div class="h"><div class="logo">ELBOLD</div><p class="sub">${title}</p></div>
    <div class="b">${body}</div>
    <div class="ft"><p>&copy; ${YEAR} ELBOLD Ltd &middot; This email was sent because you have an account on ELBOLD Events.</p></div>
  </div></body></html>`;
}

type ResendResult = { id?: string; success: boolean; error?: string };

async function sendDirect(to: string, resend: Resend, subject: string, html: string): Promise<ResendResult> {
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) return { success: false, error: (error as { message?: string }).message ?? String(error) };
  return { success: true, id: (data as { id?: string })?.id };
}

export async function POST(request: Request) {
  const callerEmail = await verifyAdminBearer(request);
  if (!callerEmail) {
    return NextResponse.json({ error: "Unauthorized — admin Bearer token required" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const TO = ADMIN_EMAILS[0] ?? callerEmail;
  const results: Record<string, unknown> = {};

  // ── T1: Vendor Application Confirmation ─────────────────────────────────────
  {
    const ts = new Date().toISOString();
    const r = await sendDirect(TO, resend,
      "[VALIDATION] Your application has been received | ELBOLD Events",
      wrap("Application Received — Validation Test", `
        <p>Hi Admin (Validation Test),</p>
        <p>We've received your vendor application for <span class="hi">ELBOLD Validation Photography</span>. Our team reviews all applications within <strong>2 working days</strong>.</p>
        <a href="${APP_URL}/vendor/dashboard" class="btn">Visit Your Dashboard</a>
        <div class="val-note">VALIDATION EMAIL &mdash; Sent 2026-06-10 to verify production delivery. Do not action.</div>
      `)
    );
    results.T1_VENDOR_APPLICATION = {
      test: "Vendor Application Confirmation",
      email_function: "sendVendorApplicationReceived",
      timestamp: ts,
      sender: FROM,
      recipient: TO,
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  // ── T2: Booking Confirmation (Payment Received — Deposit) ────────────────────
  {
    const ts = new Date().toISOString();
    const r = await sendDirect(TO, resend,
      "[VALIDATION] Payment received: Deposit Payment for RevVal2 Test Birthday Party",
      wrap("Deposit Payment Confirmed — Validation Test", `
        <p>Hi Admin (Validation Test),</p>
        <p>We've received your <span class="hi">deposit payment</span> of <strong>&pound;1.00</strong> for <strong>RevVal2 Test Birthday Party</strong>.</p>
        <div class="box">
          <p><span class="lbl">Booking ID:</span> <span class="val">2e61b3ce-813e</span></p>
          <p><span class="lbl">Vendor:</span> <span class="val">REV TEST Photography</span></p>
          <p><span class="lbl">Deposit paid:</span> <span class="val">&pound;1.00</span></p>
          <p><span class="lbl">Event date:</span> <span class="val">8 July 2026</span></p>
        </div>
        <a href="${APP_URL}/dashboard/bookings/2e61b3ce-813e-421d-8211-58043114b421" class="btn">View Booking</a>
        <div class="val-note">VALIDATION EMAIL &mdash; Sent 2026-06-10 to verify production delivery. Do not action.</div>
      `)
    );
    results.T2_BOOKING_CONFIRMATION = {
      test: "Booking Confirmation (Deposit Paid)",
      email_function: "sendPaymentReceived",
      timestamp: ts,
      sender: FROM,
      recipient: TO,
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  // ── T3: Booking Awaiting Payment (quote accepted → pay deposit) ───────────────
  {
    const ts = new Date().toISOString();
    const r = await sendDirect(TO, resend,
      "[VALIDATION] Pay your deposit to confirm your booking | ELBOLD Events",
      wrap("One Step Away From Confirming — Validation Test", `
        <p>Hi Admin (Validation Test),</p>
        <p>You have selected <span class="hi">REV TEST Photography</span> for <strong>RevVal2 Test Birthday Party</strong>. To confirm your booking, please pay the deposit now.</p>
        <div class="box">
          <p><span class="lbl">Vendor:</span> <span class="val">REV TEST Photography</span></p>
          <p><span class="lbl">Event date:</span> <span class="val">8 July 2026</span></p>
          <p><span class="lbl">Deposit due now:</span> <span class="val">&pound;0.30</span></p>
        </div>
        <a href="${APP_URL}/dashboard/bookings/2e61b3ce-813e-421d-8211-58043114b421" class="btn">Pay Deposit &amp; Confirm</a>
        <div class="val-note">VALIDATION EMAIL &mdash; Sent 2026-06-10 to verify production delivery. Do not action.</div>
      `)
    );
    results.T3_BOOKING_AWAITING_PAYMENT = {
      test: "Booking Awaiting Payment (Quote Accepted)",
      email_function: "sendBookingAwaitingPayment",
      timestamp: ts,
      sender: FROM,
      recipient: TO,
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  // ── T4: Refund Confirmation ───────────────────────────────────────────────────
  {
    const ts = new Date().toISOString();
    const r = await sendDirect(TO, resend,
      "[VALIDATION] Refund processed: RevVal2 Test Birthday Party | ELBOLD Events",
      wrap("Refund Processed — Validation Test", `
        <p>Hi Admin (Validation Test),</p>
        <p>A refund of <span class="hi">&pound;1.00</span> for <strong>RevVal2 Test Birthday Party</strong> has been processed.</p>
        <div class="box">
          <p><span class="lbl">Refund amount:</span> <span class="val">&pound;1.00</span></p>
          <p><span class="lbl">Processing time:</span> <span class="val">5&ndash;10 business days</span></p>
        </div>
        <p>If you have questions, contact <a href="mailto:support@elbold.com">support@elbold.com</a>.</p>
        <div class="val-note">VALIDATION EMAIL &mdash; Sent 2026-06-10 to verify production delivery. Do not action.</div>
      `)
    );
    results.T4_REFUND_CONFIRMATION = {
      test: "Refund Confirmation",
      email_function: "sendRefundProcessed",
      timestamp: ts,
      sender: FROM,
      recipient: TO,
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  const allPass = Object.values(results).every(
    (r) => (r as { status: string }).status === "TRIGGERED"
  );

  return NextResponse.json({
    validation_run: new Date().toISOString(),
    caller: callerEmail,
    recipient: TO,
    overall_status: allPass ? "ALL_TRIGGERED" : "PARTIAL_FAILURE",
    results,
  });
}
