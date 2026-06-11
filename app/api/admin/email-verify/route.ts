import { NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/email-verify
 * Checks Resend domain status and sends a diagnostic email to a provided address.
 * Admin only.
 *
 * Query params:
 *   ?send_to=email@example.com  — optional, triggers a live test email send
 *   ?type=registration|approval|quote|booking  — email type to test (default: registration)
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const sendTo = searchParams.get("send_to");
  const emailType = (searchParams.get("type") ?? "registration") as
    | "registration" | "approval" | "quote" | "booking";

  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";

  // ── 1. Domain verification status ─────────────────────────────────────────
  let domainStatus: {
    found: boolean;
    name?: string;
    status?: string;
    records?: unknown[];
    error?: string;
  } = { found: false };

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = await res.json() as { data?: Array<{ name: string; status: string; records?: unknown[] }> };
        const domain = (json.data ?? []).find((d) => d.name === "elbold.com");
        if (domain) {
          domainStatus = { found: true, name: domain.name, status: domain.status, records: domain.records };
        } else {
          domainStatus = {
            found: false,
            error: `elbold.com not found in Resend. Domains present: ${(json.data ?? []).map((d) => d.name).join(", ") || "none"}`,
          };
        }
      } else {
        const text = await res.text();
        domainStatus = { found: false, error: `Resend API error ${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (err) {
      domainStatus = { found: false, error: `Network error: ${String(err)}` };
    }
  } else {
    domainStatus = { found: false, error: "RESEND_API_KEY not set" };
  }

  // ── 2. Optional test send ──────────────────────────────────────────────────
  const sendResult: { attempted: boolean; success?: boolean; error?: string; type?: string } = { attempted: false };

  if (sendTo) {
    sendResult.attempted = true;
    sendResult.type = emailType;
    try {
      let result: { success: boolean; error?: string };

      if (emailType === "registration") {
        const { sendVendorApplicationReceived } = await import("@/lib/resend");
        result = await sendVendorApplicationReceived(sendTo, "Test Vendor", "Test Business Ltd");
      } else if (emailType === "approval") {
        const { sendVendorApproved } = await import("@/lib/resend");
        result = await sendVendorApproved(sendTo, "Test Vendor", "Test Business Ltd");
      } else if (emailType === "quote") {
        const { sendBookingRequest } = await import("@/lib/resend");
        result = await sendBookingRequest(
          sendTo, "Test Vendor", "Test Birthday Party",
          "2026-08-01", "Test Customer", 500, "test-booking-id"
        );
      } else {
        const { sendBookingAccepted } = await import("@/lib/resend");
        result = await sendBookingAccepted(
          sendTo, "Test Customer", "Test Business Ltd", "Test Birthday Party", "test-booking-id"
        );
      }

      sendResult.success = result.success;
      sendResult.error = result.error;
    } catch (err) {
      sendResult.success = false;
      sendResult.error = String(err);
    }
  }

  // ── 3. Code path audit ────────────────────────────────────────────────────
  const emailPaths = [
    {
      trigger: "Vendor submits /vendor/apply form",
      route: "POST /api/vendor/apply",
      function: "sendVendorApplicationReceived(email, name, businessName)",
      status: "WIRED ✓",
      note: "Fixed in Elbold rebrand — was missing before",
    },
    {
      trigger: "Admin approves vendor in /admin/vendors",
      route: "PATCH /api/admin/vendors { status: 'approved' }",
      function: "sendVendorApproved(email, name, businessName)",
      status: "WIRED ✓",
      note: "Fires for single and bulk approve",
    },
    {
      trigger: "Admin rejects vendor",
      route: "PATCH /api/admin/vendors { status: 'rejected' }",
      function: "sendVendorRejected(email, name, businessName, reason?)",
      status: "WIRED ✓",
    },
    {
      trigger: "Customer submits booking request",
      route: "POST /api/payments/checkout (after payment)",
      function: "sendBookingRequest(vendorEmail, ...)",
      status: "WIRED ✓",
      note: "Fires in payments webhook handler",
    },
    {
      trigger: "Vendor accepts booking",
      route: "PATCH /api/bookings/[id] { status: 'accepted' }",
      function: "sendBookingAccepted(customerEmail, ...)",
      status: "WIRED ✓",
    },
    {
      trigger: "Admin approves verification doc",
      route: "PATCH /api/admin/verifications { action: 'approve' }",
      function: "sendVerificationApproved(email, vendorName, docType)",
      status: "WIRED ✓",
    },
    {
      trigger: "Customer signs up (email confirmation)",
      route: "Supabase Auth (automatic)",
      function: "Supabase magic link",
      status: "WIRED ✓",
      note: "Handled by Supabase Auth — uses their own email or SMTP relay",
    },
  ];

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    configuration: {
      resend_api_key_set: !!apiKey,
      from_address: "Elbold <noreply@elbold.com>",
      app_url: appUrl,
    },
    domain_verification: domainStatus,
    test_send: sendResult,
    email_paths: emailPaths,
    next_steps: domainStatus.status === "verified"
      ? ["Domain verified — email delivery is live"]
      : [
          "1. Add elbold.com to Resend: https://resend.com/domains",
          "2. Add SPF record: v=spf1 include:amazonses.com ~all",
          "3. Add DKIM CNAME record provided by Resend",
          "4. Add DMARC record: v=DMARC1; p=none; rua=mailto:dmarc@elbold.com",
          "5. DNS propagation takes up to 48h — re-run this check after",
          `6. Once verified, test: GET /api/admin/email-verify?send_to=your@email.com&type=registration`,
        ],
  });
}
