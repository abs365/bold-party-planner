import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Bold Party <noreply@boldparty.co.uk>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://boldparty.co.uk";
const year = new Date().getFullYear();

interface EmailResult { success: boolean; error?: string }

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err: unknown) {
    console.error("Verification email error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}

function wrap(headerTitle: string, headerSub: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{font-family:Inter,-apple-system,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:24px 0}
    .container{max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
    .header{padding:28px 32px;background:#ffffff;border-bottom:1px solid #f3f4f6;text-align:center}
    .logo{font-size:19px;font-weight:800;color:#111827;letter-spacing:-0.3px;margin:0 0 4px}
    .logo span{background:linear-gradient(135deg,#d946ef,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .header-sub{color:#6b7280;font-size:13px;margin:0;font-weight:500}
    .body{padding:32px}
    .body p{color:#4b5563;font-size:15px;line-height:1.65;margin:0 0 16px}
    .btn{display:inline-block;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:white!important;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:8px 0}
    .status-box{border-radius:10px;padding:16px 20px;margin:18px 0}
    .status-approved{background:#f0fdf4;border:1px solid #bbf7d0}
    .status-rejected{background:#fef2f2;border:1px solid #fecaca}
    .status-pending{background:#fffbeb;border:1px solid #fde68a}
    .status-info{background:#eff6ff;border:1px solid #bfdbfe}
    .status-box p{margin:4px 0;font-size:13px;color:#374151}
    .status-label{font-weight:700;font-size:14px;margin:0 0 6px!important}
    .footer{padding:20px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .footer a{color:#9ca3af;font-size:11px;text-decoration:none;margin:0 6px}
    .footer p{color:#9ca3af;font-size:11px;margin:8px 0 0;line-height:1.5}
    .divider{height:1px;background:#f3f4f6;margin:20px 0}
    h2{color:#111827;font-size:20px;font-weight:700;margin:0 0 12px}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div class="logo">✦ <span>Bold Party</span></div>
      <p class="header-sub">${headerSub}</p>
    </div>
    <div class="body">
      <h2>${headerTitle}</h2>
      ${body}
    </div>
    <div class="footer">
      <div>
        <a href="${APP_URL}/privacy">Privacy</a>
        <a href="${APP_URL}/terms">Terms</a>
        <a href="${APP_URL}/vendor/verification">Verification Centre</a>
      </div>
      <p>© ${year} Bold Party Ltd. All rights reserved.<br>This email was sent regarding your Bold Party vendor account.</p>
    </div>
  </div></body></html>`;
}

// ── Email functions ───────────────────────────────────────────────────────────

export async function sendVerificationApproved(
  to: string,
  vendorName: string,
  docType: string
): Promise<EmailResult> {
  const docLabel = docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const html = wrap(
    "Document Verified",
    "Verification Update",
    `<p>Hi ${vendorName},</p>
    <div class="status-box status-approved">
      <p class="status-label">✅ Document Approved</p>
      <p>Your <strong>${docLabel}</strong> has been reviewed and approved by our team.</p>
    </div>
    <p>This brings you one step closer to becoming a Business Verified vendor on Bold Party, which helps you:</p>
    <ul style="color:#4b5563;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px">
      <li>Rank higher in search results</li>
      <li>Display your trust badge on your profile</li>
      <li>Build confidence with customers</li>
    </ul>
    <a href="${APP_URL}/vendor/verification" class="btn">View Verification Status</a>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af">If you have remaining documents to submit, head to your Verification Centre to complete the process.</p>`
  );
  return send(to, `Document approved — ${docLabel} | Bold Party`, html);
}

export async function sendVerificationRejected(
  to: string,
  vendorName: string,
  docType: string,
  reason: string,
  canResubmit: boolean
): Promise<EmailResult> {
  const docLabel = docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const html = wrap(
    canResubmit ? "Document Needs Resubmission" : "Document Not Accepted",
    "Verification Update",
    `<p>Hi ${vendorName},</p>
    <div class="status-box status-rejected">
      <p class="status-label">${canResubmit ? "⚠️ Action Required" : "❌ Document Not Accepted"}</p>
      <p>Your <strong>${docLabel}</strong> submission could not be approved.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    </div>
    ${canResubmit
      ? `<p>Don't worry — you can resubmit a new copy. Please ensure:</p>
         <ul style="color:#4b5563;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px">
           <li>The document is clear and fully visible</li>
           <li>All text and dates are legible</li>
           <li>The document is current and not expired</li>
           <li>The file is in JPG, PNG, or PDF format</li>
         </ul>
         <a href="${APP_URL}/vendor/verification" class="btn">Resubmit Document</a>`
      : `<p>Unfortunately this document cannot be resubmitted. If you believe this is an error, please <a href="mailto:support@boldparty.co.uk" style="color:#d946ef">contact our support team</a>.</p>`
    }`
  );
  const subject = canResubmit
    ? `Action required: Resubmit your ${docLabel} | Bold Party`
    : `Document not accepted: ${docLabel} | Bold Party`;
  return send(to, subject, html);
}

export async function sendResubmissionRequested(
  to: string,
  vendorName: string,
  docType: string,
  adminNote: string
): Promise<EmailResult> {
  const docLabel = docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const html = wrap(
    "Please Resubmit Your Document",
    "Verification Update",
    `<p>Hi ${vendorName},</p>
    <div class="status-box status-pending">
      <p class="status-label">📄 Resubmission Needed</p>
      <p>Our team has reviewed your <strong>${docLabel}</strong> and requires a clearer copy.</p>
      ${adminNote ? `<p><strong>Note from our team:</strong> ${adminNote}</p>` : ""}
    </div>
    <p>Please upload a new copy that is:</p>
    <ul style="color:#4b5563;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px">
      <li>Fully visible with no cropping</li>
      <li>All text and dates clearly legible</li>
      <li>Not expired (if applicable)</li>
    </ul>
    <a href="${APP_URL}/vendor/verification" class="btn">Upload New Document</a>`
  );
  return send(to, `Resubmission requested: ${docLabel} | Bold Party`, html);
}

export async function sendLevelUpgraded(
  to: string,
  vendorName: string,
  newLevel: number
): Promise<EmailResult> {
  const levelNames: Record<number, string> = {
    1: "Verified",
    2: "Business Verified",
    3: "Trusted Pro",
    4: "Premium Partner",
  };
  const levelName = levelNames[newLevel] ?? `Level ${newLevel}`;
  const levelColor = newLevel >= 3 ? "#d946ef" : newLevel === 2 ? "#3b82f6" : "#22c55e";

  const html = wrap(
    `You've Reached ${levelName}`,
    "Verification Level Update",
    `<p>Hi ${vendorName},</p>
    <div class="status-box status-approved" style="text-align:center;padding:24px">
      <p style="font-size:32px;margin:0 0 8px">🏆</p>
      <p class="status-label" style="font-size:18px;color:${levelColor}">${levelName}</p>
      <p style="margin:0;font-size:13px;color:#6b7280">Verification Level ${newLevel} achieved</p>
    </div>
    <p>Congratulations! Your Bold Party vendor profile is now <strong style="color:${levelColor}">${levelName}</strong>.</p>
    ${newLevel === 2 ? `<p>Your verified business status will now appear on your public profile, helping customers trust and book you with confidence.</p>` : ""}
    ${newLevel === 3 ? `<p>Your Trusted Pro badge recognises your excellent track record, response rate, and customer satisfaction. This will significantly boost your bookings.</p>` : ""}
    ${newLevel === 4 ? `<p>As a Premium Partner, you receive priority placement, featured listings, and dedicated support from the Bold Party team.</p>` : ""}
    <a href="${APP_URL}/vendor/dashboard" class="btn">View Your Dashboard</a>
    <p style="font-size:13px;color:#9ca3af;margin-top:12px">Your trust badge is now live on your public profile at <a href="${APP_URL}/vendor/profile" style="color:#d946ef">boldparty.co.uk</a></p>`
  );
  return send(to, `You've reached ${levelName} status on Bold Party!`, html);
}

export async function sendPremiumPartnerInvite(
  to: string,
  vendorName: string
): Promise<EmailResult> {
  const html = wrap(
    "You've Been Invited to Premium Partner",
    "Exclusive Invitation",
    `<p>Hi ${vendorName},</p>
    <div class="status-box status-info" style="text-align:center;padding:24px">
      <p style="font-size:32px;margin:0 0 8px">⭐</p>
      <p class="status-label" style="font-size:18px;color:#d946ef">Premium Partner Invitation</p>
    </div>
    <p>Based on your exceptional performance and reputation on Bold Party, our team is inviting you to join the <strong>Premium Partner</strong> programme.</p>
    <p>As a Premium Partner, you'll receive:</p>
    <ul style="color:#4b5563;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px">
      <li>Priority placement at the top of all search results</li>
      <li>Featured on the Bold Party homepage</li>
      <li>Premium Partner badge on your profile</li>
      <li>Dedicated account manager</li>
      <li>Early access to new platform features</li>
    </ul>
    <a href="${APP_URL}/vendor/verification" class="btn">Accept Invitation</a>
    <p style="font-size:13px;color:#9ca3af;margin-top:12px">This invitation is exclusive and not offered to all vendors. We look forward to welcoming you.</p>`
  );
  return send(to, "You've been invited to Premium Partner status | Bold Party", html);
}

export async function sendVerificationExpiryReminder(
  to: string,
  vendorName: string,
  docType: string,
  daysUntilExpiry: number
): Promise<EmailResult> {
  const docLabel = docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const urgency = daysUntilExpiry <= 7 ? "status-rejected" : "status-pending";
  const html = wrap(
    "Document Expiring Soon",
    "Verification Reminder",
    `<p>Hi ${vendorName},</p>
    <div class="status-box ${urgency}">
      <p class="status-label">${daysUntilExpiry <= 7 ? "🚨 Urgent" : "⏰ Reminder"}: Document Expiring in ${daysUntilExpiry} Days</p>
      <p>Your <strong>${docLabel}</strong> verification document is expiring soon.</p>
    </div>
    <p>To maintain your verified status and avoid any disruption to your profile, please upload a renewed copy before expiry.</p>
    <a href="${APP_URL}/vendor/verification" class="btn">Update Document</a>
    <p style="font-size:13px;color:#9ca3af;margin-top:12px">Keeping your documents current ensures customers can always trust your profile.</p>`
  );
  return send(to, `Action required: Your ${docLabel} expires in ${daysUntilExpiry} days | Bold Party`, html);
}
