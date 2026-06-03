import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit({ identifier: `signup:${ip}`, limit: 5, windowMs: 60 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  const { email, password, fullName, role, emailRedirectTo } = await req.json() as {
    email: string;
    password: string;
    fullName: string;
    role: "customer" | "vendor";
    emailRedirectTo: string;
  };

  logger.info("auth.signup.attempt", { email, role, redirectTo: emailRedirectTo });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo,
    },
  });

  if (error) {
    logger.warn("auth.signup.supabase_error", { email, role, err: error });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Supabase silently "succeeds" for existing emails when email confirmation is enabled —
  // it returns a user with an empty identities array instead of an error.
  // We detect this and return a clear 409 so the UI can show the right message.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    logger.info("auth.signup.duplicate_email", { email, role });
    return NextResponse.json(
      { error: "An account already exists with this email. Please sign in or reset your password." },
      { status: 409 }
    );
  }

  logger.info("auth.signup.success", {
    userId: data.user?.id,
    email,
    role,
    hasSession: !!data.session,
    emailConfirmationRequired: !data.session,
  });

  return NextResponse.json(
    { hasSession: !!data.session },
    {
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
      },
    }
  );
}
