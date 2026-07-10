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
    .select("id, business_name, user_id, created_at, profiles!vendors_user_id_fkey(email)")
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

    const [bookingsRes, quotesRes, followUpRes, unreadRes, nextEventRes, lastContactRes] = await Promise.all([
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
      // WP-C3 (REG-19) — most recent CRM contact, any status, to detect a
      // vendor who has gone quiet on the platform's most subscription-
      // resilient capability. Not gated on is_archived: an archived contact
      // still shows the vendor was recently active in the CRM.
      supabase.from("manual_contacts").select("created_at")
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const upcomingEvents = (nextEventRes.data ?? [])
      .map((b) => b.event as unknown as { title: string; date: string } | null)
      .filter((e): e is { title: string; date: string } => e != null && e.date <= in3Days && e.date >= now.toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date));

    // WP-C3 (REG-19): "no CRM contact added in 14 days" (2030 Strategy §4.3).
    // Only considered once the vendor has had a fair 14-day runway since
    // their own account was created, so a brand-new vendor on day 2 isn't
    // nudged before they've had a reasonable chance to add a contact.
    const vendorAgeDays = Math.floor((now.getTime() - new Date(vendor.created_at).getTime()) / 86_400_000);
    const lastContactAt = lastContactRes.data?.[0]?.created_at ?? null;
    const daysSinceLastContact = lastContactAt
      ? Math.floor((now.getTime() - new Date(lastContactAt).getTime()) / 86_400_000)
      : null;
    // Days the CRM has been quiet, measured from the last contact if one
    // exists, otherwise from account creation. Fires on day 14, then every
    // 7 days after (21, 28...) rather than every single day once true -
    // matches this file's own "no all-quiet email, don't habituate vendors
    // to ignore it" principle applied to a recurring condition, not just
    // the one-shot conditions above. Resolves itself the moment a contact
    // is added (daysSinceLastContact resets to 0).
    const daysQuiet = daysSinceLastContact ?? vendorAgeDays;
    const crmHasGoneQuiet = daysQuiet >= 14 && daysQuiet % 7 === 0;

    const summary = {
      vendorId: vendor.id,
      businessName: vendor.business_name,
      pendingBookings: bookingsRes.count ?? 0,
      pendingQuotes: quotesRes.count ?? 0,
      unreadMessages: unreadRes.count ?? 0,
      contactsNeedingFollowUp: followUpRes.count ?? 0,
      nextEvent: upcomingEvents[0] ?? null,
      crmQuietDays: crmHasGoneQuiet ? daysQuiet : null,
    };

    const hasSomethingToReport =
      summary.pendingBookings > 0 || summary.pendingQuotes > 0 ||
      summary.unreadMessages > 0 || summary.contactsNeedingFollowUp > 0 ||
      summary.nextEvent !== null || summary.crmQuietDays !== null;

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
