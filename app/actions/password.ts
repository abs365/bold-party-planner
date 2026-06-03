"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* read-only context */ }
        },
      },
    }
  );
}

export async function requestPasswordResetAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("email") ?? "") as string;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const headersList = await headers();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const origin = headersList.get("origin") ?? appUrl;
  const redirectTo = `${origin.startsWith("http") ? origin : `https://${origin}`}/api/auth/callback?next=/reset-password&type=recovery`;

  const supabase = await makeClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { error: error.message };
  }

  // Always return success — Supabase doesn't reveal whether the email exists (security best practice)
  return { success: true };
}

export async function updatePasswordAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const password = (formData.get("password") ?? "") as string;
  const confirm  = (formData.get("confirm")  ?? "") as string;

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await makeClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.message.includes("same password")) {
      return { error: "Your new password must be different from your current password." };
    }
    return { error: error.message };
  }

  redirect("/login?reset=success");
}
