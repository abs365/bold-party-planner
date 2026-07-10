import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendVendorDailySummary } from "@/lib/resend/vendor-digest";
import { isAuthorisedCron } from "@/lib/cron-auth";

// Daily digest email - only sent when there's at least one thing worth a
// vendor's attention (pending booking/quote, unread message, overdue
// follow-up, or an event in the next 3 days). No "all quiet" email, to
// avoid training vendors to ignore it.
//
// Reuses: manual_contacts.follow_up_at (Priority 2/3), the notifications
// table's unread count, and the empty `email_log` table (migration 002,
// never previously written to - wired up here for the first time).
export async function GET(req: Request) {
  if (!isAuthorisedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 86_400_000).toISOString().slice(0, 10);

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, business_name, user_id, profiles!vendors_user_id_fkey(email)")
    .eq("status", "approved")
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: optedOut } = await supabase
    .from("vendor_notification_preferences")
    .select("vendor_id")
    .eq("daily_summary_email", false);
  const optedOutIds = new Set((optedOut ?? []).map((r) => r.vendor_id));

  let sent = 0;
  let skipped = 0;

  for (const vendor of vendors ?? []) {
    if (optedOutIds.has(vendor.id)) { skipped++; continue; }

    const email = (vendor.profiles as unknown as { email: string } | null)?.email;
    if (!email) { skipped++; continue; }

    const [bookingsRes, quotesRes, followUpRes, unreadRes, nextEventRes] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("vendor_id", vendor.id).eq("status", "pending"),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("vendor_id", vendor.id).eq("status", "pending"),
      supabase.from("manual_contacts").select("id", { count: "exact", head: true })
        .eq("vendor_id", vendor.id).eq("is_archived", false)
        .not("follow_up_at", "is", null).lte("follow_up_at", now.toISOString())
        .not("stage", "in", '("won","lost")'),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", vendor.user_id).eq("read", false),
      supabase.from("bookings")
        .select("event:events(title, date)")
        .eq("vendor_id", vendor.id)
        .in("status", ["accepted", "confirmed"]),
    ]);

    const upcomingEvents = (nextEventRes.data ?? [])
      .map((b) => b.event as unknown as { title: string; date: string } | null)
      .filter((e): e is { title: string; date: string } => e != null && e.date <= in3Days && e.date >= now.toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date));

    const summary = {
      vendorId: vendor.id,
      businessName: vendor.business_name,
      pendingBookings: bookingsRes.count ?? 0,
      pendingQuotes: quotesRes.count ?? 0,
      unreadMessages: unreadRes.count ?? 0,
      contactsNeedingFollowUp: followUpRes.count ?? 0,
      nextEvent: upcomingEvents[0] ?? null,
    };

    const hasSomethingToReport =
      summary.pendingBookings > 0 || summary.pendingQuotes > 0 ||
      summary.unreadMessages > 0 || summary.contactsNeedingFollowUp > 0 ||
      summary.nextEvent !== null;

    if (!hasSomethingToReport) { skipped++; continue; }

    const result = await sendVendorDailySummary(summary, email);

    await supabase.from("email_log").insert({
      recipient_email: email,
      template: "vendor_daily_summary",
      subject: "Your Elbold daily summary",
      status: result.success ? "sent" : "failed",
      error: result.error ?? null,
    });

    if (result.success) sent++;
  }

  return NextResponse.json({ success: true, sent, skipped });
}
