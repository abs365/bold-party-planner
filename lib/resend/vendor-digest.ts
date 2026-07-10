import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Elbold <noreply@elbold.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
const year = new Date().getFullYear();

interface EmailResult { success: boolean; error?: string }

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  let recipient = to;
  let emailSubject = subject;

  if (process.env.VERCEL_ENV !== "production") {
    const override = process.env.RESEND_DEV_OVERRIDE_EMAIL;
    if (!override) {
      console.info(`[resend:dev] Email to "${to}" suppressed (VERCEL_ENV is not "production"). Set RESEND_DEV_OVERRIDE_EMAIL to redirect emails in dev.`);
      return { success: true };
    }
    emailSubject = `[DEV → ${to}] ${subject}`;
    recipient = override;
  }

  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM, to: recipient, subject: emailSubject, html });
    return { success: true };
  } catch (err: unknown) {
    console.error("Vendor digest email error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}

function wrap(headerSub: string, body: string, vendorId: string): string {
  const unsubscribeUrl = `${APP_URL}/api/vendor/notification-preferences/unsubscribe?vendor=${vendorId}&type=daily_summary`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{font-family:Inter,-apple-system,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:24px 0}
    .container{max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
    .header{padding:28px 32px;background:#0d1b3e;text-align:center}
    .logo{font-size:20px;font-weight:800;color:#C9A84C;letter-spacing:2px;margin:0 0 2px}
    .header-sub{color:rgba(255,255,255,0.7);font-size:13px;margin:0;font-weight:500}
    .body{padding:32px}
    .body p{color:#4b5563;font-size:15px;line-height:1.65;margin:0 0 16px}
    .btn{display:inline-block;background:#0d1b3e;color:white!important;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:8px 0;border:2px solid #C9A84C}
    .stat-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f3f4f6}
    .stat-row:last-child{border-bottom:none}
    .stat-label{color:#6b7280;font-size:14px}
    .stat-value{color:#111827;font-size:16px;font-weight:700}
    .stat-value.attention{color:#b45309}
    .footer{padding:20px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .footer a{color:#9ca3af;font-size:11px;text-decoration:none;margin:0 6px}
    .footer p{color:#9ca3af;font-size:11px;margin:8px 0 0;line-height:1.5}
    h2{color:#111827;font-size:20px;font-weight:700;margin:0 0 12px}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div class="logo">Elbold</div>
      <p class="header-sub">${headerSub}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <div>
        <a href="${APP_URL}/vendor/dashboard">Dashboard</a>
        <a href="${APP_URL}/privacy">Privacy</a>
        <a href="${unsubscribeUrl}">Turn off daily summary</a>
      </div>
      <p>© ${year} ELBOLD Ltd. All rights reserved.<br>This is your daily vendor summary from Elbold.</p>
    </div>
  </div></body></html>`;
}

export interface VendorDailySummaryInput {
  vendorId: string;
  businessName: string;
  pendingBookings: number;
  pendingQuotes: number;
  unreadMessages: number;
  contactsNeedingFollowUp: number;
  nextEvent: { title: string; date: string } | null;
  // WP-C3 (REG-19): set when the vendor hasn't added a CRM contact in
  // 14+ days (the count itself, not just a boolean, so the copy can be
  // specific). null means no nudge this run.
  crmQuietDays: number | null;
}

function statRow(label: string, value: number, attention = false): string {
  return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value${attention && value > 0 ? " attention" : ""}">${value}</span></div>`;
}

// Only sent when there's at least one thing worth surfacing (see the cron) -
// no "all quiet" email is sent, to avoid habituating vendors to ignore it.
export async function sendVendorDailySummary(input: VendorDailySummaryInput, to: string): Promise<EmailResult> {
  const nextEventLine = input.nextEvent
    ? `<p style="margin-top:20px">Next event: <strong>${input.nextEvent.title}</strong> on ${new Date(input.nextEvent.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</p>`
    : "";

  const crmQuietLine = input.crmQuietDays !== null
    ? `<p style="margin-top:20px">It's been ${input.crmQuietDays} days since you added a contact to your CRM. Got a client from Instagram, WhatsApp or a referral recently? <a href="${APP_URL}/vendor/contacts">Add them now</a> so their history stays with your business, not scattered across apps.</p>`
    : "";

  const body = `
    <h2>Good morning, ${input.businessName}</h2>
    <p>Here's what needs your attention today.</p>
    <div class="detail-box" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:4px 20px;margin:16px 0">
      ${statRow("Bookings awaiting your response", input.pendingBookings, true)}
      ${statRow("Quote requests to answer", input.pendingQuotes, true)}
      ${statRow("Unread messages", input.unreadMessages, true)}
      ${statRow("Contacts due a follow-up", input.contactsNeedingFollowUp, true)}
    </div>
    ${nextEventLine}
    ${crmQuietLine}
    <a href="${APP_URL}/vendor/dashboard" class="btn">Open Your Dashboard</a>
  `;

  return send(to, "Your Elbold daily summary", wrap("Daily Summary", body, input.vendorId));
}
