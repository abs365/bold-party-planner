"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = (formData.get("email") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;
  const redirectTo = (formData.get("redirectTo") ?? "/dashboard") as string;

  console.log("[AUTH-DEBUG] loginAction start — email:", email, "redirectTo:", redirectTo);

  const cookieStore = await cookies();
  console.log("[AUTH-DEBUG] loginAction — cookies before auth:", cookieStore.getAll().map((c) => c.name));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          console.log("[AUTH-DEBUG] loginAction setAll called — cookies to set:", cookiesToSet.map((c) => ({ name: c.name, valueLen: c.value.length, options: c.options })));
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
            console.log("[AUTH-DEBUG] loginAction setAll — cookies set successfully");
          } catch (err) {
            console.error("[AUTH-DEBUG] loginAction setAll — ERROR setting cookies:", err);
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("[AUTH-DEBUG] loginAction signInWithPassword —", {
    hasUser: !!data.user,
    hasSession: !!data.session,
    userId: data.user?.id,
    sessionExpiresAt: data.session?.expires_at,
    error: error?.message,
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

  console.log("[AUTH-DEBUG] loginAction — profile role:", profile?.role);

  const dest = profile?.role === "vendor" ? "/vendor/dashboard" : redirectTo;
  console.log("[AUTH-DEBUG] loginAction — redirecting to:", dest);
  console.log("[AUTH-DEBUG] loginAction — cookies after auth:", cookieStore.getAll().map((c) => c.name));

  redirect(dest);
}
