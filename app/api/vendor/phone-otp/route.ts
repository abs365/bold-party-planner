import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const sendSchema = z.object({
  action: z.literal("send"),
  phone: z.string().min(7).max(20),
});

const verifySchema = z.object({
  action: z.literal("verify"),
  phone: z.string().min(7).max(20),
  code: z.string().length(6),
});

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ identifier: `phone-otp:${user.id}`, limit: 5, windowMs: 15 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait before requesting another code." }, { status: 429 });
  }

  const body = await req.json();
  const actionRaw = (body as { action?: unknown }).action;

  if (actionRaw === "send") {
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { phone } = parsed.data;

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const db = await createAdminClient();

    // Invalidate any prior unused codes for this user+phone
    await db
      .from("phone_otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("used_at", null);

    const { error: insertError } = await db.from("phone_otp_codes").insert({
      user_id: user.id,
      phone,
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to create verification code" }, { status: 500 });
    }

    // Fetch profile name for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const recipientEmail = profile?.email ?? user.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "No email address on account" }, { status: 400 });
    }

    const { sendPhoneOtpCode } = await import("@/lib/resend");
    const emailResult = await sendPhoneOtpCode(
      recipientEmail,
      profile?.full_name ?? "there",
      code,
      phone
    );

    if (!emailResult.success) {
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, expiresAt });
  }

  if (actionRaw === "verify") {
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { phone, code } = parsed.data;
    const db = await createAdminClient();

    const { data: otpRow } = await db
      .from("phone_otp_codes")
      .select("id, code, expires_at, used_at")
      .eq("user_id", user.id)
      .eq("phone", phone)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json({ error: "No active verification code found. Request a new one." }, { status: 400 });
    }

    if (new Date(otpRow.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code has expired. Request a new one." }, { status: 400 });
    }

    if (otpRow.code !== code) {
      return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 });
    }

    // Mark OTP as used
    await db
      .from("phone_otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    // Update profiles
    await db
      .from("profiles")
      .update({ phone, phone_verified: true })
      .eq("id", user.id);

    // Update vendors table if a vendor record exists
    await db
      .from("vendors")
      .update({ phone_verified: true })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
