import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/account/delete
// Schedules account for deletion. Anonymises personal data immediately;
// financial records (bookings, payments) are retained for 7 years per UK law.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ ...RATE_LIMITS.auth, identifier: `account_delete:${ip}` });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  const { user, supabase } = ctx;

  // Prevent deletion if vendor has active bookings
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .gt("event_date", new Date().toISOString())
    .limit(1);

  if (activeBookings && activeBookings.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete account with upcoming confirmed bookings. Cancel or complete them first." },
      { status: 409 }
    );
  }

  const db = await createAdminClient();

  // Anonymise profile (GDPR erasure — retain structure for FK integrity)
  await db.from("profiles").update({
    full_name: "[Deleted User]",
    email: `deleted+${user.id}@elbold.internal`,
    phone: null,
    avatar_url: null,
  }).eq("id", user.id);

  // If vendor — anonymise vendor record but retain for booking history
  await db.from("vendors").update({
    bio: null,
    phone: null,
    instagram_url: null,
    website_url: null,
  }).eq("user_id", user.id);

  // Log the deletion request
  await db.from("audit_logs").insert({
    action: "account.deletion_requested",
    actor_id: user.id,
    actor_role: "user",
    details: { requested_at: new Date().toISOString() },
  }).select().maybeSingle();

  // Sign out all sessions
  await db.auth.admin.signOut(user.id, "global");

  return NextResponse.json({
    success: true,
    message: "Your account has been anonymised. Financial records are retained for 7 years as required by UK law.",
  });
}
