"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { rateLimit } from "@/lib/rate-limit";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = (formData.get("email") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;
  const redirectTo = (formData.get("redirectTo") ?? "/dashboard") as string;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "anonymous";
  const rl = await rateLimit({ identifier: `login:${ip}`, limit: 5, windowMs: 15 * 60_000 });
  if (!rl.allowed) {
    return { error: "Rate limit exceeded" };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in read-only contexts (middleware); safe to ignore
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed")) {
      return {
        error:
          "Please confirm your email first. Check your inbox for the confirmation link.",
      };
    }
    if (msg.includes("invalid login credentials")) {
      return { error: "Incorrect email or password. Please try again." };
    }
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // Only override the destination for vendor role when the user hasn't specified a
  // particular page to return to (i.e. redirectTo is the default "/dashboard").
  // If redirectTo is a specific path (e.g. /vendor/apply after auth redirect), honour it.
  let dest = redirectTo;
  if (profile?.role === "vendor" && redirectTo === "/dashboard") {
    const { data: vendorRow } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    dest = vendorRow ? "/vendor/dashboard" : "/vendor/apply";
  }

  redirect(dest);
}
