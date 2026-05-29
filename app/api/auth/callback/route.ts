import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      let dest: string;
      if (adminEmails.includes(data.user.email ?? "")) {
        dest = "/admin";
      } else if (profile?.role === "vendor") {
        // Check if vendor has completed onboarding
        const { data: vendor } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        dest = vendor ? "/vendor/dashboard" : "/vendor/apply";
      } else {
        dest = next;
      }

      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
