import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendVendorApplicationReceived,
  sendPaymentReceived,
  sendRefundProcessed,
  sendBookingAwaitingPayment,
} from "@/lib/resend";

// Temporary admin-only email validation endpoint.
// Auth: verifies the Supabase Bearer token and confirms the caller
// is in the ADMIN_EMAILS list before running any email sends.
// Remove this file after validation is complete.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

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

export async function POST(request: Request) {
  const callerEmail = await verifyAdminBearer(request);
  if (!callerEmail) {
    return NextResponse.json({ error: "Unauthorized — admin Bearer token required" }, { status: 401 });
  }

  const TO = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? callerEmail;
  const results: Record<string, unknown> = {};

  // ── T1: Vendor Application Confirmation ─────────────────────────────────────
  {
    const ts = new Date().toISOString();
    const r = await sendVendorApplicationReceived(
      TO,
      "Admin (Validation Test)",
      "ELBOLD Validation Photography"
    );
    results.T1_VENDOR_APPLICATION = {
      test: "Vendor Application Confirmation",
      email_function: "sendVendorApplicationReceived",
      timestamp: ts,
      sender: "ELBOLD <noreply@elbold.com>",
      recipient: TO,
      subject: "[VALIDATION] Your application has been received | ELBOLD Events",
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  // ── T2: Booking Confirmation (Payment Received — Deposit) ────────────────────
  {
    const ts = new Date().toISOString();
    const r = await sendPaymentReceived(
      TO,
      "Admin (Validation Test)",
      1.00,
      "RevVal2 Test Birthday Party",
      "deposit",
      "2e61b3ce-813e-421d-8211-58043114b421"
    );
    results.T2_BOOKING_CONFIRMATION = {
      test: "Booking Confirmation (Deposit Paid)",
      email_function: "sendPaymentReceived",
      timestamp: ts,
      sender: "ELBOLD <noreply@elbold.com>",
      recipient: TO,
      subject: "[VALIDATION] Payment received: Deposit Payment for RevVal2 Test Birthday Party",
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  // ── T3: Booking Awaiting Payment (sent to customer when quote is accepted) ───
  {
    const ts = new Date().toISOString();
    const r = await sendBookingAwaitingPayment(
      TO,
      "Admin (Validation Test)",
      "REV TEST Photography",
      "RevVal2 Test Birthday Party",
      "2026-07-08",
      0.30,
      "2e61b3ce-813e-421d-8211-58043114b421"
    );
    results.T3_BOOKING_AWAITING_PAYMENT = {
      test: "Booking Awaiting Payment (Quote Accepted → Pay Deposit)",
      email_function: "sendBookingAwaitingPayment",
      timestamp: ts,
      sender: "ELBOLD <noreply@elbold.com>",
      recipient: TO,
      subject: "[VALIDATION] Pay your deposit to confirm your booking | ELBOLD Events",
      resend_response: r,
      status: r.success ? "TRIGGERED" : "FAILED",
    };
  }

  // ── T4: Refund Confirmation ───────────────────────────────────────────────────
  {
    const ts = new Date().toISOString();
    const r = await sendRefundProcessed(
      TO,
      "Admin (Validation Test)",
      1.00,
      "RevVal2 Test Birthday Party"
    );
    results.T4_REFUND_CONFIRMATION = {
      test: "Refund Confirmation",
      email_function: "sendRefundProcessed",
      timestamp: ts,
      sender: "ELBOLD <noreply@elbold.com>",
      recipient: TO,
      subject: "[VALIDATION] Refund processed: RevVal2 Test Birthday Party",
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
