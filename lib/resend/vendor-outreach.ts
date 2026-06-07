import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "ELBOLD <noreply@elbold.com>";

interface EmailResult { success: boolean; error?: string }

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    await getResend().emails.send({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err: unknown) {
    console.error("Outreach email error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}

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
    .badge{display:inline-block;background:#C9A84C;color:#0d1b3e;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
    .divider{height:1px;background:#f3f4f6;margin:24px 0}
    .footer{padding:20px 32px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .footer-links{margin:0 0 12px}
    .footer-links a{color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px}
    .footer p{color:#9ca3af;font-size:11px;margin:0;line-height:1.5}
    .highlight{color:#0d1b3e;font-weight:700}
    .step{display:flex;align-items:flex-start;gap:12px;margin:10px 0;font-size:14px;color:#4b5563}
    .step-num{background:#0d1b3e;color:#C9A84C;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
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
        <a href="${appUrl}">elbold.com</a>
        <a href="${appUrl}/vendor/dashboard">Your Dashboard</a>
        <a href="mailto:support@elbold.com">Support</a>
      </div>
      <p>© ${year} ELBOLD Ltd · Registered in England and Wales<br>
      <a href="${appUrl}/vendor/dashboard" style="color:#9ca3af;font-size:11px">Manage notifications</a></p>
    </div>
  </div></body></html>`;
}

// ── 1. Founding Vendor Welcome ────────────────────────────────────────────────
// Sent to newly approved vendors in the founding cohort.

export async function sendFoundingVendorWelcome(to: string, name: string, businessName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, "Welcome to the ELBOLD Founding Vendor Programme 🎉", wrap(
    "You're a Founding Vendor",
    `<p>Hi ${name},</p>
    <div class="badge">Founding Vendor</div>
    <p><strong>${businessName}</strong> is now live on ELBOLD Events as one of our founding vendors. This is a significant milestone — you're one of the first professionals to join the marketplace.</p>
    <p>As a Founding Vendor, you get:</p>
    <div class="detail-box">
      <p>🏅 <strong>Founding Vendor badge</strong> — permanently on your profile</p>
      <p>💰 <strong>Keep 90%</strong> of every booking — we take just 10%</p>
      <p>📈 <strong>Priority placement</strong> in search during our launch period</p>
      <p>🤝 <strong>Direct access</strong> to the ELBOLD team for any support</p>
    </div>
    <p>Your next steps to maximise your first enquiries:</p>
    <div class="detail-box">
      <p>📸 Upload 5+ high-quality photos of your work</p>
      <p>📦 Create at least 2 service packages with clear pricing</p>
      <p>✍️ Write a compelling bio (100+ characters)</p>
      <p>🔒 Complete ID verification to earn your verified badge</p>
    </div>
    <a href="${appUrl}/vendor/dashboard" class="btn">Go to Your Dashboard</a>
    <p style="margin-top:24px">Thank you for being part of ELBOLD from the very beginning. Let's build something great together.</p>`
  ));
}

// ── 2. Verification Reminder ──────────────────────────────────────────────────
// Sent to approved vendors who have not completed verification.

export async function sendVerificationReminder(
  to: string,
  name: string,
  businessName: string,
  missing: string[],
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const missingList = missing.map((m) => `<p>⚠️ ${m}</p>`).join("");
  return send(to, "Action needed: Complete your verification on ELBOLD", wrap(
    "Verification Reminder",
    `<p>Hi ${name},</p>
    <p>Customers on ELBOLD trust verified vendors significantly more than unverified ones — and we want to make sure <strong>${businessName}</strong> is ready to compete.</p>
    <p>Your profile is still missing the following verifications:</p>
    <div class="detail-box">
      ${missingList}
    </div>
    <p>Verified vendors earn the <strong>ID Verified</strong> or <strong>Business Verified</strong> badge on their profile and in every search result — this is the single biggest trust signal for customers choosing between vendors.</p>
    <p>It takes less than 5 minutes to upload your documents. Our team reviews them within 24 hours.</p>
    <a href="${appUrl}/vendor/verification" class="btn">Complete Verification</a>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af">Questions? Reply to this email or contact us at support@elbold.com.</p>`
  ));
}

// ── 3. Package Completion Reminder ───────────────────────────────────────────
// Sent to vendors who have no service packages (customers cannot request quotes).

export async function sendPackageCompletionReminder(to: string, name: string, businessName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return send(to, "Customers can't request quotes yet — add your first package", wrap(
    "Add Your Service Packages",
    `<p>Hi ${name},</p>
    <p>Good news — <strong>${businessName}</strong> is live on ELBOLD. But there's one thing stopping customers from requesting a quote from you: <strong>you haven't created a service package yet.</strong></p>
    <p>Without at least one package, the "Request a Quote" button on your profile is hidden. You're invisible to customers ready to book.</p>
    <p>Creating your first package takes under 2 minutes:</p>
    <div class="detail-box">
      <p><strong>Step 1</strong> — Give it a name (e.g. "4-Hour DJ Set" or "Full Day Photography")</p>
      <p><strong>Step 2</strong> — Set a price (or price range)</p>
      <p><strong>Step 3</strong> — Write 1–2 sentences about what's included</p>
    </div>
    <p>You can update the details any time — the goal is to get your first package live so customers can start enquiring.</p>
    <a href="${appUrl}/vendor/services" class="btn">Add Your First Package</a>`
  ));
}

// ── 4. Profile Completion Reminder ───────────────────────────────────────────
// Sent to vendors with a low readiness score and a specific next action.

export async function sendProfileCompletionReminder(
  to: string,
  name: string,
  businessName: string,
  score: number,
  nextAction: string,
  nextHref: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Building" : score >= 25 ? "Starting" : "Minimal";
  return send(to, `Your profile is at ${score}% — here's your next step`, wrap(
    "Strengthen Your Profile",
    `<p>Hi ${name},</p>
    <p>Your ELBOLD profile for <strong>${businessName}</strong> is currently at <strong>${score}% readiness</strong> (${label}). Vendors with stronger profiles receive significantly more quote requests.</p>
    <p>Your single most impactful next step:</p>
    <div class="detail-box">
      <p style="font-size:15px;color:#111827;font-weight:600">${nextAction}</p>
    </div>
    <p>This one action will lift your profile score and make your listing more competitive in search.</p>
    <a href="${appUrl}${nextHref}" class="btn">Complete This Step</a>
    <p style="margin-top:24px">You can see your full profile checklist on your dashboard. Let us know if you need help with anything.</p>`
  ));
}
