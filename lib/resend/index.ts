import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Bold Party <noreply@boldparty.co.uk>";

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

// ── Email templates ──────────────────────────────────────────────────────────

function wrap(title: string, body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://boldparty.co.uk";
  const year = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}
    body{font-family:Inter,-apple-system,Arial,sans-serif;background:#0a0a0f;color:#f8fafc;margin:0;padding:20px 0}
    .container{max-width:560px;margin:0 auto;background:#13131f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden}
    .header{background:linear-gradient(135deg,#d946ef 0%,#8b5cf6 100%);padding:28px 32px;text-align:center}
    .logo{font-size:20px;font-weight:800;color:white;letter-spacing:-0.3px;margin:0 0 6px}
    .header-sub{color:rgba(255,255,255,0.85);font-size:13px;margin:0}
    .body{padding:32px}
    .body p{color:#94a3b8;font-size:15px;line-height:1.65;margin:0 0 16px}
    .btn{display:inline-block;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:white;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:8px 0 4px}
    .detail-box{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;margin:16px 0}
    .detail-box p{margin:5px 0;font-size:13px;color:#94a3b8}
    .detail-label{color:#6b7280}
    .detail-value{color:#f8fafc;font-weight:600}
    .divider{height:1px;background:rgba(255,255,255,0.06);margin:24px 0}
    .footer{padding:20px 32px 24px;text-align:center}
    .footer-links{margin:0 0 12px}
    .footer-links a{color:#4b5563;font-size:12px;text-decoration:none;margin:0 8px}
    .footer-links a:hover{color:#6b7280}
    .footer p{color:#374151;font-size:11px;margin:0;line-height:1.5}
    .highlight{color:#d946ef;font-weight:700}
    .trust-row{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px}
    .trust-item{color:#4b5563;font-size:11px;display:flex;align-items:center;gap:4px}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div class="logo">✦ Bold Party</div>
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
        <a href="${appUrl}">boldparty.co.uk</a>
        <a href="${appUrl}/privacy">Privacy</a>
        <a href="${appUrl}/terms">Terms</a>
        <a href="mailto:support@boldparty.co.uk">Support</a>
      </div>
      <p>© ${year} Bold Party Event Planner Ltd · Registered in England and Wales<br>
      This email was sent to you because you have an account on Bold Party.<br>
      <a href="${appUrl}/dashboard" style="color:#4b5563;font-size:11px">Manage notifications</a></p>
    </div>
  </div></body></html>`;
}

export async function sendVendorApplicationReceived(to: string, name: string, businessName: string) {
  return send(to, "Your vendor application has been received — Bold Party", wrap(
    "Application Received",
    `<p>Hi ${name},</p>
    <p>We've received your vendor application for <span class="highlight">${businessName}</span>. Our team will review it within <strong>24–48 hours</strong>.</p>
    <p>Once approved, you'll appear on our marketplace and can start receiving bookings immediately.</p>
    <p>In the meantime, you can log in to add more details to your profile, upload photos and videos, and set up your packages.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard" class="btn">Visit Your Dashboard</a>
    <p style="margin-top:24px">Thanks for joining Bold Party!</p>`
  ));
}

export async function sendVendorApproved(to: string, name: string, businessName: string) {
  return send(to, "🎉 Your vendor profile is approved — Bold Party", wrap(
    "You're Live on Bold Party!",
    `<p>Hi ${name},</p>
    <p>Great news — <span class="highlight">${businessName}</span> has been approved and is now live on Bold Party!</p>
    <p>Customers across the UK can now find and book your services. Here's what to do next:</p>
    <div class="detail-box">
      <p>✅ Upload 8–15 high-quality photos of your work</p>
      <p>✅ Add a highlight video (optional but recommended)</p>
      <p>✅ Create your service packages with clear pricing</p>
      <p>✅ Complete your bio with your experience and specialities</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard" class="btn">Go to Dashboard</a>`
  ));
}

export async function sendVendorRejected(to: string, name: string, businessName: string) {
  return send(to, "Update on your vendor application — Bold Party", wrap(
    "Application Update",
    `<p>Hi ${name},</p>
    <p>Thank you for applying to Bold Party. After review, we were unable to approve <span class="highlight">${businessName}</span> at this time.</p>
    <p>This may be due to incomplete information or not meeting our current quality standards. You're welcome to reapply with more details about your business and portfolio.</p>
    <p>If you have questions, please contact us at support@boldparty.co.uk.</p>`
  ));
}

export async function sendBookingRequest(
  to: string, vendorName: string, eventTitle: string, eventDate: string,
  customerName: string, amount: number, bookingId: string
) {
  return send(to, `New booking request for ${eventTitle} — Bold Party`, wrap(
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
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/bookings/${bookingId}" class="btn">View & Respond</a>`
  ));
}

export async function sendBookingAccepted(
  to: string, customerName: string, vendorBusiness: string, eventTitle: string, bookingId: string
) {
  return send(to, `Booking confirmed — ${vendorBusiness} accepted your request`, wrap(
    "Booking Accepted! 🎉",
    `<p>Hi ${customerName},</p>
    <p>Great news! <span class="highlight">${vendorBusiness}</span> has accepted your booking for <strong>${eventTitle}</strong>.</p>
    <p>Your booking is now confirmed. To secure your booking, please pay the deposit now.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${bookingId}" class="btn">Pay Deposit & Confirm</a>
    <p style="margin-top:16px;font-size:13px;color:#6b7280">If you have any questions, you can message the vendor through your booking page.</p>`
  ));
}

export async function sendBookingRejected(
  to: string, customerName: string, vendorBusiness: string, eventTitle: string
) {
  return send(to, `Booking update for ${eventTitle} — Bold Party`, wrap(
    "Booking Update",
    `<p>Hi ${customerName},</p>
    <p>Unfortunately, <span class="highlight">${vendorBusiness}</span> was unable to accept your booking for <strong>${eventTitle}</strong>.</p>
    <p>Don't worry — there are hundreds of other verified vendors ready to help make your event a success.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/browse" class="btn">Browse Other Vendors</a>`
  ));
}

export async function sendPaymentReceived(
  to: string, name: string, amount: number, eventTitle: string, type: "deposit" | "full", bookingId: string
) {
  const label = type === "deposit" ? "Deposit Payment" : "Full Payment";
  return send(to, `Payment received — ${label} for ${eventTitle}`, wrap(
    `${label} Confirmed ✅`,
    `<p>Hi ${name},</p>
    <p>We've received your <span class="highlight">${label.toLowerCase()}</span> of <strong>£${amount.toFixed(2)}</strong> for <strong>${eventTitle}</strong>.</p>
    <p>Your booking is now secured. You can view your invoice and booking details below.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${bookingId}" class="btn">View Booking</a>`
  ));
}

export async function sendVendorPaymentNotification(
  to: string, vendorName: string, amount: number, eventTitle: string, bookingId: string
) {
  return send(to, `Payment received for ${eventTitle} — Bold Party`, wrap(
    "Payment Received",
    `<p>Hi ${vendorName},</p>
    <p>A payment of <strong>£${amount.toFixed(2)}</strong> has been made for your booking: <strong>${eventTitle}</strong>.</p>
    <p>Your payout of <span class="highlight">£${(amount * 0.9).toFixed(2)}</span> will be processed after the event is completed.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/bookings/${bookingId}" class="btn">View Booking</a>`
  ));
}

export async function sendEventReminder(
  to: string, customerName: string, eventTitle: string, eventDate: string, daysLeft: number
) {
  return send(to, `${daysLeft} day${daysLeft !== 1 ? "s" : ""} until ${eventTitle} — Bold Party`, wrap(
    `${daysLeft} days to go!`,
    `<p>Hi ${customerName},</p>
    <p>Just a reminder that <span class="highlight">${eventTitle}</span> is in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> on <strong>${eventDate}</strong>.</p>
    <p>Check your event checklist to make sure everything is on track.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Event Checklist</a>`
  ));
}

export async function sendReviewRequest(
  to: string, customerName: string, vendorBusiness: string, bookingId: string
) {
  return send(to, `How was ${vendorBusiness}? Leave a review — Bold Party`, wrap(
    "Share Your Experience",
    `<p>Hi ${customerName},</p>
    <p>We hope your event was amazing! How was <span class="highlight">${vendorBusiness}</span>?</p>
    <p>Sharing your experience helps other customers find great vendors — and helps vendors grow their business.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${bookingId}?review=1" class="btn">Leave a Review</a>
    <p style="font-size:13px;color:#6b7280;margin-top:16px">Takes less than 60 seconds.</p>`
  ));
}

export async function sendRefundProcessed(
  to: string, name: string, amount: number, eventTitle: string
) {
  return send(to, `Refund processed — ${eventTitle}`, wrap(
    "Refund Processed",
    `<p>Hi ${name},</p>
    <p>A refund of <span class="highlight">£${amount.toFixed(2)}</span> for <strong>${eventTitle}</strong> has been processed.</p>
    <p>It should appear in your account within 5–10 business days depending on your bank.</p>
    <p>If you have questions, contact support@boldparty.co.uk.</p>`
  ));
}
