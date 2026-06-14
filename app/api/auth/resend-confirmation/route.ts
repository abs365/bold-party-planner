import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit({ identifier: `resend-confirm:${ip}`, limit: 3, windowMs: 15 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  let email: string;
  try {
    const body = await request.json() as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
  }

  const supabase = await createClient();

  // resend() sends a new confirmation email if the user exists and is unconfirmed.
  // Supabase returns success even if the email is already confirmed (prevents enumeration).
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    logger.warn("auth.resend_confirmation.failed", { email, err: error });
    // Don't expose the exact error to prevent enumeration
    return NextResponse.json(
      { error: "Could not send confirmation email. If you already confirmed your email, try signing in." },
      { status: 400 }
    );
  }

  logger.info("auth.resend_confirmation.sent", { email });
  return NextResponse.json({ success: true });
}
