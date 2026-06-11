import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Elbold <noreply@elbold.com>";

interface EmailResult { success: boolean; error?: string }

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err: unknown) {
    console.error("Email send error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}

// ── Email wrapper ─────────────────────────────────────────────────────────────

function wrap(title: string, body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const year = new Date().getFullYear();
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
    .detail-label{color:#9ca3af}
    .detail-value{color:#111827;font-weight:600}
    .divider{height:1px;background:#f3f4f6;margin:24px 0}
    .footer{padding:20px 32px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .footer-links{margin:0 0 12px}
    .footer-links a{color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px}
    .footer p{color:#9ca3af;font-size:11px;margin:0;line-height:1.5}
    .highlight{color:#0d1b3e;font-weight:700}
    .trust-row{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0;padding:12px;background:#f9fafb;border-radius:8px}
    .trust-item{color:#9ca3af;font-size:11px;display:flex;align-items:center;gap:4px}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div class="logo">Elbold</div>
      <p class="header-sub">${title}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <div class="trust-row">
        <span class="trust-item">🔒 Stripe-secured</span>
        <span class="trust-item">✅ Verified vendors</span>
        <span class="trust-item">🛡️ Dispute protection</span>
      </div>
      <div class="footer-links">
        <a href="${appUrl}">elbold.com</a>
        <a href="${appUrl}/privacy">Privacy</a>
        <a href="${appUrl}/terms">Terms</a>
        <a href="mailto:support@elbold.com">Support</a>
      </div>
      <p>© ${year} ELBOLD Ltd. All rights reserved.<br>
      This email was sent because you have an account on Elbold.<br>
      <a href="${appUrl}/dashboard" style="color:#9ca3af;font-size:11px">Manage notifications</a></p>
    </div>
  </div></body></html>`;
}

// ── Email functions ───────────────────────────────────────────────────────────

export async function sendVendorApplicationReceived(to: string, name: string, businessName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, "Your application has been received | Elbold", wrap(
    "Application Received",
    `<p>Hi ${name},</p>
    <p>We've received your vendor application for <span class="highlight">${businessName}</span>. Our team reviews all applications within <strong>2 working days</strong> and will email you with the outcome.</p>
    <p>Once approved, your profile will go live on Elbold and you can start receiving enquiries immediately.</p>
    <p>In the meantime, you can log in to add more details to your profile, upload photos, and set up your packages.</p>
    <a href="${appUrl}/vendor/dashboard" class="btn">Visit Your Dashboard</a>
    <p style="margin-top:24px">Welcome to Elbold!</p>`
  ));
}

export async function sendVendorApproved(to: string, name: string, businessName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, "🎉 Your vendor profile is approved | Elbold", wrap(
    "You're Live on Elbold!",
    `<p>Hi ${name},</p>
    <p>Great news! <span class="highlight">${businessName}</span> has been approved and is now live on Elbold!</p>
    <p>Customers across the UK can now find and book your services. Here's what to do next:</p>
    <div class="detail-box">
      <p>✅ Upload 8–15 high-quality photos of your work</p>
      <p>✅ Add a highlight video (optional but recommended)</p>
      <p>✅ Create your service packages with clear pricing</p>
      <p>✅ Complete your bio with your experience and specialities</p>
    </div>
    <a href="${appUrl}/vendor/dashboard" class="btn">Go to Dashboard</a>`
  ));
}

export async function sendVendorRejected(to: string, name: string, businessName: string, reason?: string) {
  const reasonBlock = reason
    ? `<div class="detail-box"><p><strong>Reason:</strong> ${reason}</p></div>`
    : "";
  return send(to, "Update on your vendor application | Elbold", wrap(
    "Application Update",
    `<p>Hi ${name},</p>
    <p>Thank you for applying to Elbold. After review, we were unable to approve <span class="highlight">${businessName}</span> at this time.</p>
    ${reasonBlock}
    <p>You're welcome to reapply with more details about your business and portfolio.</p>
    <p>If you have questions, please contact us at <a href="mailto:support@elbold.com" style="color:#0d1b3e">support@elbold.com</a>.</p>`
  ));
}

export async function sendBookingRequest(
  to: string, vendorName: string, eventTitle: string, eventDate: string,
  customerName: string, amount: number, bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `New booking request for ${eventTitle} | Elbold`, wrap(
    "New Booking Request",
    `<p>Hi ${vendorName},</p>
    <p>You have a new booking request from <span class="highlight">${customerName}</span>.</p>
    <div class="detail-box">
      <p><span class="detail-label">Event:</span> <span class="detail-value">${eventTitle}</span></p>
      <p><span class="detail-label">Date:</span> <span class="detail-value">${eventDate}</span></p>
      <p><span class="detail-label">Amount:</span> <span class="detail-value">£${amount.toFixed(2)}</span></p>
      <p><span class="detail-label">Your payout:</span> <span class="detail-value">£${(amount * 0.9).toFixed(2)}</span></p>
    </div>
    <p>Please respond within 48 hours to keep your acceptance rate high.</p>
    <a href="${appUrl}/vendor/bookings/${bookingId}" class="btn">View & Respond</a>`
  ));
}

export async function sendBookingAccepted(
  to: string, customerName: string, vendorBusiness: string, eventTitle: string, bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `Booking confirmed: ${vendorBusiness} accepted your request`, wrap(
    "Booking Accepted! 🎉",
    `<p>Hi ${customerName},</p>
    <p>Great news! <span class="highlight">${vendorBusiness}</span> has accepted your booking for <strong>${eventTitle}</strong>.</p>
    <p>Your booking is now confirmed. To secure your booking, please pay the deposit now.</p>
    <a href="${appUrl}/dashboard/bookings/${bookingId}" class="btn">Pay Deposit & Confirm</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">If you have any questions, you can message the vendor through your booking page.</p>`
  ));
}

export async function sendBookingRejected(
  to: string, customerName: string, vendorBusiness: string, eventTitle: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `Booking update for ${eventTitle} | Elbold`, wrap(
    "Booking Update",
    `<p>Hi ${customerName},</p>
    <p>Unfortunately, <span class="highlight">${vendorBusiness}</span> was unable to accept your booking for <strong>${eventTitle}</strong>.</p>
    <p>Don't worry. There are plenty of other verified vendors ready to help make your event a success.</p>
    <a href="${appUrl}/browse" class="btn">Browse Other Vendors</a>`
  ));
}

export async function sendPaymentReceived(
  to: string, name: string, amount: number, eventTitle: string, type: "deposit" | "full", bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const label = type === "deposit" ? "Deposit Payment" : "Full Payment";
  return send(to, `Payment received: ${label} for ${eventTitle}`, wrap(
    `${label} Confirmed ✅`,
    `<p>Hi ${name},</p>
    <p>We've received your <span class="highlight">${label.toLowerCase()}</span> of <strong>£${amount.toFixed(2)}</strong> for <strong>${eventTitle}</strong>.</p>
    <p>Your booking is now secured. You can view your invoice and booking details below.</p>
    <a href="${appUrl}/dashboard/bookings/${bookingId}" class="btn">View Booking</a>`
  ));
}

export async function sendVendorPaymentNotification(
  to: string, vendorName: string, amount: number, eventTitle: string, bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `Payment received for ${eventTitle} | Elbold`, wrap(
    "Payment Received",
    `<p>Hi ${vendorName},</p>
    <p>A payment of <strong>£${amount.toFixed(2)}</strong> has been made for your booking: <strong>${eventTitle}</strong>.</p>
    <p>Your payout of <span class="highlight">£${(amount * 0.9).toFixed(2)}</span> will be processed within 7 working days of event completion via bank transfer to your registered account.</p>
    <a href="${appUrl}/vendor/bookings/${bookingId}" class="btn">View Booking</a>`
  ));
}

export async function sendEventReminder(
  to: string, customerName: string, eventTitle: string, eventDate: string, daysLeft: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `${daysLeft} day${daysLeft !== 1 ? "s" : ""} until ${eventTitle} | Elbold`, wrap(
    `${daysLeft} days to go!`,
    `<p>Hi ${customerName},</p>
    <p>Just a reminder that <span class="highlight">${eventTitle}</span> is in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> on <strong>${eventDate}</strong>.</p>
    <p>Check your event checklist to make sure everything is on track.</p>
    <a href="${appUrl}/dashboard" class="btn">View Event Checklist</a>`
  ));
}

export async function sendReviewRequest(
  to: string, customerName: string, vendorBusiness: string, bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `How was ${vendorBusiness}? Leave a review | Elbold`, wrap(
    "Share Your Experience",
    `<p>Hi ${customerName},</p>
    <p>We hope your event was amazing! How was <span class="highlight">${vendorBusiness}</span>?</p>
    <p>Sharing your experience helps other customers find great vendors, and helps vendors grow their business.</p>
    <a href="${appUrl}/dashboard/bookings/${bookingId}?review=1" class="btn">Leave a Review</a>
    <p style="font-size:13px;color:#9ca3af;margin-top:16px">Takes less than 60 seconds.</p>`
  ));
}

export async function sendBookingPaymentFailed(
  to: string, name: string, eventTitle: string, bookingId: string, amount: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `Payment failed: action required | Elbold`, wrap(
    "Payment Failed: Action Required",
    `<p>Hi ${name},</p>
    <p>Your payment of <span class="highlight">£${amount.toFixed(2)}</span> for <strong>${eventTitle}</strong> was declined by your bank or card provider.</p>
    <div class="detail-box">
      <p>Common reasons for a declined payment:</p>
      <p>• Insufficient funds or credit limit reached</p>
      <p>• Card expired or incorrect details</p>
      <p>• Bank security block on online transactions</p>
    </div>
    <p>Your booking is still on hold. Please try again with a different payment method or contact your bank.</p>
    <a href="${appUrl}/dashboard/bookings/${bookingId}" class="btn">Retry Payment</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">If you continue to experience issues, contact <a href="mailto:support@elbold.com" style="color:#9ca3af">support@elbold.com</a></p>`
  ));
}

export async function sendRefundProcessed(
  to: string, name: string, amount: number, eventTitle: string
) {
  return send(to, `Refund processed: ${eventTitle}`, wrap(
    "Refund Processed",
    `<p>Hi ${name},</p>
    <p>A refund of <span class="highlight">£${amount.toFixed(2)}</span> for <strong>${eventTitle}</strong> has been processed.</p>
    <p>It should appear in your account within 5–10 business days depending on your bank.</p>
    <p>If you have questions, contact <a href="mailto:support@elbold.com" style="color:#0d1b3e">support@elbold.com</a>.</p>`
  ));
}

// ── Quote lifecycle emails ─────────────────────────────────────────────────────

export async function sendQuoteRequestToVendor(
  to: string,
  vendorName: string,
  customerName: string,
  eventType: string,
  eventDate: string | null,
  budgetMax: number | null,
  quoteId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const budgetLine = budgetMax ? `<p><span class="detail-label">Budget:</span> <span class="detail-value">up to £${budgetMax.toLocaleString("en-GB")}</span></p>` : "";
  const dateLine = eventDate ? `<p><span class="detail-label">Event date:</span> <span class="detail-value">${new Date(eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></p>` : "";
  return send(to, `New quote request from ${customerName} | Elbold`, wrap(
    "New Quote Request",
    `<p>Hi ${vendorName},</p>
    <p><span class="highlight">${customerName}</span> has requested a quote for their event. Vendors who respond within 2 hours win significantly more bookings.</p>
    <div class="detail-box">
      <p><span class="detail-label">Event type:</span> <span class="detail-value">${eventType.replace(/_/g, " ")}</span></p>
      ${dateLine}
      ${budgetLine}
    </div>
    <p>Log in to review the full request and submit your price.</p>
    <a href="${appUrl}/vendor/quotes" class="btn">View & Respond</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">We recommend responding as soon as possible so the customer can continue planning.</p>`
  ));
}

export async function sendQuoteResponseToCustomer(
  to: string,
  customerName: string,
  vendorBusiness: string,
  price: number,
  quoteId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `${vendorBusiness} has responded to your quote | Elbold`, wrap(
    "Quote Response Received",
    `<p>Hi ${customerName},</p>
    <p><span class="highlight">${vendorBusiness}</span> has submitted a price for your event.</p>
    <div class="detail-box">
      <p><span class="detail-label">Quoted price:</span> <span class="detail-value">£${price.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span></p>
      <p><span class="detail-label">Deposit required:</span> <span class="detail-value">£${(price * 0.3).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span></p>
    </div>
    <p>Review the full quote details, compare with other vendors, and accept or decline at your convenience.</p>
    <a href="${appUrl}/dashboard/quotes/${quoteId}" class="btn">View Quote</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">You are not committed to anything until you accept.</p>`
  ));
}

export async function sendQuoteAcceptedToVendor(
  to: string,
  vendorName: string,
  customerName: string,
  eventType: string,
  price: number,
  bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `Quote accepted: ${customerName} has booked you! | Elbold`, wrap(
    "Quote Accepted: Booking Created",
    `<p>Hi ${vendorName},</p>
    <p>Congratulations! <span class="highlight">${customerName}</span> has accepted your quote and a booking has been created.</p>
    <div class="detail-box">
      <p><span class="detail-label">Event:</span> <span class="detail-value">${eventType.replace(/_/g, " ")}</span></p>
      <p><span class="detail-label">Agreed price:</span> <span class="detail-value">£${price.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span></p>
      <p><span class="detail-label">Your payout (90%):</span> <span class="detail-value">£${(price * 0.9).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span></p>
    </div>
    <p>The booking is awaiting deposit payment from the customer. You will be notified as soon as payment is received and the booking is confirmed.</p>
    <a href="${appUrl}/vendor/bookings/${bookingId}" class="btn">View Booking</a>`
  ));
}

export async function sendBookingAwaitingPayment(
  to: string,
  customerName: string,
  vendorBusiness: string,
  eventTitle: string,
  eventDate: string | null,
  depositAmount: number,
  bookingId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const dateLine = eventDate
    ? `<p><span class="detail-label">Event date:</span> <span class="detail-value">${new Date(eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></p>`
    : "";
  return send(to, `Pay your deposit to confirm your booking | Elbold`, wrap(
    "One Step Away From Confirming",
    `<p>Hi ${customerName},</p>
    <p>You have selected <span class="highlight">${vendorBusiness}</span> for <strong>${eventTitle}</strong>. To confirm your booking, please pay the deposit now.</p>
    <div class="detail-box">
      <p><span class="detail-label">Vendor:</span> <span class="detail-value">${vendorBusiness}</span></p>
      ${dateLine}
      <p><span class="detail-label">Deposit due now:</span> <span class="detail-value">£${depositAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span></p>
    </div>
    <p>Your deposit is processed securely through Stripe and managed by Elbold. It is only released to the vendor after your event is completed.</p>
    <a href="${appUrl}/dashboard/bookings/${bookingId}" class="btn">Pay Deposit &amp; Confirm</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">Your date is reserved but not confirmed until the deposit is paid. Pay now to lock it in.</p>`
  ));
}

export async function sendQuoteSubmittedToCustomer(
  to: string,
  customerName: string,
  vendorBusiness: string,
  eventType: string,
  eventDate: string | null,
  quoteId: string,
  eventTitle?: string | null
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const eventLabel = eventTitle ?? eventType.replace(/_/g, " ");
  const dateLine = dateStr
    ? `<p><span class="detail-label">Event date:</span> <span class="detail-value">${dateStr}</span></p>`
    : "";
  return send(to, `Quote request received | Elbold`, wrap(
    "Quote Request Received",
    `<p>Hi ${customerName},</p>
    <p>Your quote request has been sent to <span class="highlight">${vendorBusiness}</span>. We have notified them and they will review your request shortly.</p>
    <div class="detail-box">
      <p><span class="detail-label">Vendor:</span> <span class="detail-value">${vendorBusiness}</span></p>
      <p><span class="detail-label">Event:</span> <span class="detail-value">${eventLabel}</span></p>
      ${dateLine}
    </div>
    <p><strong>What happens next:</strong></p>
    <div class="detail-box">
      <p>1. ${vendorBusiness} reviews your request</p>
      <p>2. If available, they send you a detailed quote with pricing</p>
      <p>3. You receive an email notification when your quote arrives</p>
      <p>4. You can compare, accept, and book securely through Elbold</p>
    </div>
    <p>Most vendors respond within 2–24 hours. You can track your request at any time from your dashboard.</p>
    <a href="${appUrl}/dashboard/quotes/${quoteId}" class="btn">View Your Request</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">You are under no obligation until you accept a quote. Your payment is protected by Stripe.</p>`
  ));
}

export async function sendQuoteRejectedToVendor(
  to: string,
  vendorName: string,
  customerName: string,
  eventType: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, `Quote update | Elbold`, wrap(
    "Quote Not Selected",
    `<p>Hi ${vendorName},</p>
    <p>${customerName} has chosen a different vendor for their ${eventType.replace(/_/g, " ")} event.</p>
    <p>This happens. Availability, budget, and timing all play a role. Your profile is still live and new enquiries will continue to arrive.</p>
    <a href="${appUrl}/vendor/quotes" class="btn">View Your Leads</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">Tip: Vendors who upload 8+ photos and respond within 2 hours win significantly more bookings.</p>`
  ));
}

export async function sendEventCreated(
  to: string,
  name: string,
  eventTitle: string,
  eventType: string,
  eventDate: string,
  city: string,
  guestCount: number,
  eventId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const dateFormatted = new Date(eventDate).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return send(to, `Your event has been created: ${eventTitle}`, wrap(
    "Event Created",
    `<p>Hi ${name},</p>
    <p>Your event has been saved on Elbold. Here is a summary:</p>
    <div class="detail-box">
      <p><span class="detail-label">Event:</span> <span class="detail-value">${eventTitle}</span></p>
      <p><span class="detail-label">Type:</span> <span class="detail-value">${eventType.replace(/_/g, " ")}</span></p>
      <p><span class="detail-label">Date:</span> <span class="detail-value">${dateFormatted}</span></p>
      <p><span class="detail-label">Location:</span> <span class="detail-value">${city}</span></p>
      <p><span class="detail-label">Guests:</span> <span class="detail-value">${guestCount}</span></p>
    </div>
    <p>Your Smart Plan has been generated. View vendor recommendations, manage your checklist, and track your budget from your dashboard.</p>
    <a href="${appUrl}/dashboard/events/${eventId}" class="btn">View My Event</a>
    <p style="margin-top:24px;font-size:13px;color:#6b7280">If quote requests were sent to vendors, you will hear back within 24 hours.</p>`
  ));
}

export async function sendAdminNewVendorAlert(
  adminEmails: string[],
  businessName: string,
  category: string,
  city: string,
  vendorEmail: string,
  vendorId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const results = await Promise.allSettled(
    adminEmails.map((adminEmail) =>
      send(adminEmail, `New vendor application: ${businessName} - Elbold Admin`, wrap(
        "New Vendor Application",
        `<p>A new vendor has submitted an application and is awaiting review.</p>
        <div class="detail-box">
          <p><span class="detail-label">Business:</span> <span class="detail-value">${businessName}</span></p>
          <p><span class="detail-label">Category:</span> <span class="detail-value">${category}</span></p>
          <p><span class="detail-label">City:</span> <span class="detail-value">${city}</span></p>
          <p><span class="detail-label">Email:</span> <span class="detail-value">${vendorEmail}</span></p>
        </div>
        <a href="${appUrl}/admin/vendors?status=pending" class="btn">Review Application</a>`
      ))
    )
  );
  const allOk = results.every((r) => r.status === "fulfilled" && r.value.success);
  return { success: allOk };
}

export async function sendAdminRefundAlert(
  adminEmails: string[],
  bookingId: string,
  amount: number,
  eventTitle: string,
  customerEmail: string,
  cancelledBy: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  await Promise.allSettled(
    adminEmails.map((adminEmail) =>
      send(adminEmail, `Refund issued: ${eventTitle} — Elbold Admin`, wrap(
        "Automatic Refund Issued",
        `<p>A refund has been automatically issued following a booking cancellation.</p>
        <div class="detail-box">
          <p><span class="detail-label">Event:</span> <span class="detail-value">${eventTitle}</span></p>
          <p><span class="detail-label">Refund amount:</span> <span class="detail-value">£${amount.toFixed(2)}</span></p>
          <p><span class="detail-label">Customer:</span> <span class="detail-value">${customerEmail}</span></p>
          <p><span class="detail-label">Cancelled by:</span> <span class="detail-value">${cancelledBy}</span></p>
        </div>
        <a href="${appUrl}/admin/bookings/${bookingId}" class="btn">View Booking</a>`
      ))
    )
  );
}

export async function sendPhoneOtpCode(
  to: string,
  name: string,
  code: string,
  phone: string
) {
  return send(to, "Your Elbold phone verification code", wrap(
    "Phone Verification",
    `<p>Hi ${name},</p>
    <p>Use the code below to verify your phone number <span class="highlight">${phone}</span>.</p>
    <div class="detail-box" style="text-align:center">
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0d1b3e;margin:8px 0">${code}</p>
      <p style="margin:0;font-size:12px;color:#9ca3af">This code expires in 15 minutes</p>
    </div>
    <p>If you did not request this, you can safely ignore this email.</p>`
  ));
}

// ── Messaging notification emails ─────────────────────────────────────────────

export async function sendNewMessageToVendor(
  to: string,
  vendorName: string,
  customerName: string,
  messagePreview: string,
  threadUrl: string
) {
  const preview = messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview;
  return send(to, `New message from ${customerName} | Elbold`, wrap(
    "New Message",
    `<p>Hi ${vendorName},</p>
    <p><span class="highlight">${customerName}</span> has sent you a message on Elbold.</p>
    <div class="detail-box">
      <p style="font-style:italic;color:#374151">&ldquo;${preview}&rdquo;</p>
    </div>
    <p>Reply directly from your dashboard — vendors who respond quickly win significantly more bookings.</p>
    <a href="${threadUrl}" class="btn">View Message &amp; Reply</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">You will not receive further email alerts for this conversation until you read the thread.</p>`
  ));
}

export async function sendNewMessageToCustomer(
  to: string,
  customerName: string,
  vendorBusiness: string,
  messagePreview: string,
  threadUrl: string
) {
  const preview = messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview;
  return send(to, `New message from ${vendorBusiness} | Elbold`, wrap(
    "New Message",
    `<p>Hi ${customerName},</p>
    <p><span class="highlight">${vendorBusiness}</span> has sent you a message on Elbold.</p>
    <div class="detail-box">
      <p style="font-style:italic;color:#374151">&ldquo;${preview}&rdquo;</p>
    </div>
    <a href="${threadUrl}" class="btn">View Message &amp; Reply</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">You will not receive further email alerts for this conversation until you read the thread.</p>`
  ));
}

export async function sendSubscriptionPaymentFailed(
  to: string,
  vendorName: string,
  plan: string,
  failCount: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const retriesLeft = Math.max(0, 4 - failCount);
  const retriesLine = retriesLeft > 0
    ? `<p><span class="detail-label">Retries remaining:</span> <span class="detail-value">${retriesLeft} (Stripe will retry automatically)</span></p>`
    : `<p><span class="detail-label">Status:</span> <span class="detail-value" style="color:#dc2626">Final attempt reached. Subscription will cancel if unpaid.</span></p>`;
  return send(to, "Action required: subscription payment failed | Elbold", wrap(
    "Payment Failed: Action Required",
    `<p>Hi ${vendorName},</p>
    <p>We were unable to process your <span class="highlight">${planLabel} plan</span> subscription renewal.</p>
    <div class="detail-box">
      <p><span class="detail-label">Plan:</span> <span class="detail-value">${planLabel}</span></p>
      <p><span class="detail-label">Attempt:</span> <span class="detail-value">${failCount} of 4</span></p>
      ${retriesLine}
    </div>
    <p>To avoid losing your paid features, please update your payment method now.</p>
    <a href="${appUrl}/vendor/subscription" class="btn">Update Payment Method</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">Once your payment is updated, your features will be restored immediately. If you believe this is an error, contact <a href="mailto:support@elbold.com" style="color:#0d1b3e">support@elbold.com</a>.</p>`
  ));
}
