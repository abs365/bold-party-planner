import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth/guards";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

// GET /api/account/export
// Returns a machine-readable JSON export of all personal data held for the user.
// GDPR Art. 20 — right to data portability.
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ ...RATE_LIMITS.auth, limit: 2, windowMs: 60 * 60_000, identifier: `export:${ip}` });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests — you may export your data once per hour" }, { status: 429 });
  }

  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  const { user, supabase } = ctx;

  const [
    { data: profile },
    { data: events },
    { data: bookings },
    { data: payments },
    { data: reviews },
    { data: vendor },
    { data: messages },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, city, created_at").eq("id", user.id).single(),
    supabase.from("events").select("id, title, date, location, guest_count, event_type, created_at").eq("user_id", user.id),
    supabase.from("bookings").select("id, status, payment_status, total_price, created_at, event_id").eq("customer_id", user.id),
    supabase.from("payments").select("amount, type, status, currency, created_at").eq("booking_id.bookings.customer_id", user.id),
    supabase.from("reviews").select("rating, comment, created_at, moderation_status").eq("customer_id", user.id),
    supabase.from("vendors").select("id, business_name, category, city, subscription_plan, created_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("messages").select("content, created_at, sender_id").or(`sender_id.eq.${user.id}`),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    profile: profile ?? null,
    vendor: vendor ?? null,
    events: events ?? [],
    bookings: bookings ?? [],
    reviews: reviews ?? [],
    messages_sent: (messages ?? []).filter((m) => m.sender_id === user.id).map((m) => ({
      content: m.content,
      sent_at: m.created_at,
    })),
    note: "Financial records (payments, invoices) may be retained for up to 7 years for legal compliance even after account deletion.",
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="elbold-data-export-${Date.now()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
