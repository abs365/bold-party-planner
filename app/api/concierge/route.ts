import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

const EVENT_TYPES = [
  "Wedding", "Birthday", "Corporate", "Anniversary",
  "Baby Shower", "Cultural Celebration", "Graduation",
  "Engagement", "Christening", "Other",
];

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name        = (body.name as string | undefined)?.trim();
  const email       = (body.email as string | undefined)?.trim();
  const event_type  = (body.event_type as string | undefined)?.trim();

  if (!name || !email || !event_type) {
    return NextResponse.json({ error: "Name, email and event type are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!EVENT_TYPES.includes(event_type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const phone      = (body.phone as string | undefined)?.trim() || null;
  const event_date = (body.event_date as string | undefined)?.trim() || null;
  const location   = (body.location as string | undefined)?.trim() || null;
  const guest_count = body.guest_count ? Number(body.guest_count) : null;
  const budget     = (body.budget as string | undefined)?.trim() || null;
  const notes      = (body.notes as string | undefined)?.trim() || null;

  // Store in DB using admin client (bypasses RLS)
  const db = await createAdminClient();
  const { error: dbError } = await db.from("concierge_requests").insert({
    name, email, phone, event_type, event_date, location, guest_count, budget, notes,
  });
  if (dbError) {
    console.error("[concierge] DB insert failed:", dbError.message);
    // Don't block — fall through to email
  }

  // Email customer confirmation
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  try {
    await getResend().emails.send({
      from: "Elbold <noreply@elbold.com>",
      to: email,
      subject: "We have received your event planning request",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Inter,-apple-system,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:20px 0}
        .c{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}
        .h{background:#0d1b3e;padding:28px 32px;text-align:center}
        .logo{font-size:22px;font-weight:800;color:#C9A84C;letter-spacing:2px;margin:0 0 4px}
        .logo-sub{color:rgba(201,168,76,0.65);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0}
        .b{padding:32px}
        .b p{color:#4b5563;font-size:15px;line-height:1.65;margin:0 0 16px}
        .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:16px 0}
        .box p{margin:5px 0;font-size:13px;color:#6b7280}
        .btn{display:inline-block;background:#0d1b3e;color:white!important;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;border:2px solid #C9A84C}
        .f{padding:20px 32px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
        .f p{color:#9ca3af;font-size:11px;margin:0}
      </style></head><body>
      <div class="c">
        <div class="h"><div class="logo">Elbold</div></div>
        <div class="b">
          <p>Hi ${name},</p>
          <p>Thank you for reaching out. We have received your request and will personally match you with suitable vendors within <strong>24 hours</strong>.</p>
          <div class="box">
            <p><strong>Event type:</strong> ${event_type}</p>
            ${event_date ? `<p><strong>Date:</strong> ${event_date}</p>` : ""}
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
            ${guest_count ? `<p><strong>Guests (approx.):</strong> ${guest_count}</p>` : ""}
            ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ""}
          </div>
          <p>If you would like to browse vendors yourself in the meantime, you are welcome to explore the marketplace.</p>
          <a href="${appUrl}/browse" class="btn">Browse Vendors</a>
          <p style="margin-top:24px;font-size:13px;color:#9ca3af">Questions? Reply to this email or contact us at support@elbold.com.</p>
        </div>
        <div class="f"><p>© ELBOLD Ltd. All rights reserved.</p></div>
      </div></body></html>`,
    });
  } catch (err) {
    console.error("[concierge] Customer confirmation email failed:", err);
  }

  // Email admin alert
  if (ADMIN_EMAILS.length > 0) {
    try {
      await getResend().emails.send({
        from: "Elbold <noreply@elbold.com>",
        to: ADMIN_EMAILS,
        subject: `New concierge request: ${event_type} from ${name}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
          body{font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px}
          .c{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px}
          h2{color:#0d1b3e;margin:0 0 16px}
          .row{display:flex;gap:8px;margin:6px 0;font-size:14px}
          .label{color:#9ca3af;min-width:120px}
          .val{color:#111827;font-weight:600}
          .notes{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:16px 0;font-size:13px;color:#4b5563}
          .btn{display:inline-block;background:#0d1b3e;color:#C9A84C!important;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;margin-top:16px}
        </style></head><body>
        <div class="c">
          <h2>New Concierge Request</h2>
          <div class="row"><span class="label">Name:</span><span class="val">${name}</span></div>
          <div class="row"><span class="label">Email:</span><span class="val">${email}</span></div>
          ${phone ? `<div class="row"><span class="label">Phone:</span><span class="val">${phone}</span></div>` : ""}
          <div class="row"><span class="label">Event type:</span><span class="val">${event_type}</span></div>
          ${event_date ? `<div class="row"><span class="label">Date:</span><span class="val">${event_date}</span></div>` : ""}
          ${location ? `<div class="row"><span class="label">Location:</span><span class="val">${location}</span></div>` : ""}
          ${guest_count ? `<div class="row"><span class="label">Guests:</span><span class="val">${guest_count}</span></div>` : ""}
          ${budget ? `<div class="row"><span class="label">Budget:</span><span class="val">${budget}</span></div>` : ""}
          ${notes ? `<div class="notes"><strong>Notes:</strong><br>${notes}</div>` : ""}
          <a href="${appUrl}/admin/concierge" class="btn">View in Admin Panel</a>
        </div></body></html>`,
      });
    } catch (err) {
      console.error("[concierge] Admin alert email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
