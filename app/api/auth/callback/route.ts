import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  logger.info("auth.callback.start", { hasCode: !!code, type: type ?? "signup" });

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.warn("auth.callback.exchange_failed", { err: error });
    }

    if (!error && data.user) {
      logger.info("auth.callback.user_resolved", { userId: data.user.id });

      // Password recovery: redirect to reset page so user can set new password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        logger.warn("auth.callback.profile_query_failed", { userId: data.user.id, err: profileError });
      }

      // If the handle_new_user trigger failed, fall back to the role stored
      // in user_metadata at signup time so vendors are never stranded on /dashboard.
      const role: string | undefined =
        profile?.role ?? (data.user.user_metadata?.role as string | undefined);

      logger.info("auth.callback.role_resolved", {
        userId: data.user.id,
        role,
        profileFound: !!profile,
        fromMetadata: !profile && !!data.user.user_metadata?.role,
      });

      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      let dest: string;
      if (adminEmails.includes(data.user.email ?? "")) {
        dest = "/admin";
      } else if (role === "vendor") {
        const { data: vendor } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        dest = vendor ? "/vendor/dashboard" : "/vendor/apply";
      } else {
        dest = next;
      }

      logger.info("auth.callback.redirect", { userId: data.user.id, dest });
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Exchange failed or no code
  logger.warn("auth.callback.redirect_to_login", { hasCode: !!code });
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
