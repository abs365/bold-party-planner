import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side admin guard for API routes.
 * Returns the authenticated user if they are in ADMIN_EMAILS, otherwise null.
 *
 * Usage in API routes:
 *   const user = await requireAdminUser();
 *   if (!user) return adminUnauthorized();
 */
export async function requireAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminEmails = env.adminEmails();
  if (adminEmails.length === 0 || !adminEmails.includes(user.email ?? "")) return null;
  return user;
}

/** Standard 401 response for admin-protected API routes. */
export function adminUnauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Admin access required." },
    { status: 401 }
  );
}

/**
 * Page-level admin guard for server components.
 * Redirects to /dashboard if user is not admin.
 *
 * Usage in page.tsx:
 *   const user = await assertAdminPage();
 */
export async function assertAdminPage() {
  const { redirect } = await import("next/navigation");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const adminEmails = env.adminEmails();
  // TypeScript narrowing: redirect() throws, so user is non-null past the previous check
  if (!adminEmails.includes((user as NonNullable<typeof user>).email ?? "")) redirect("/dashboard");
  return user as NonNullable<typeof user>;
}
