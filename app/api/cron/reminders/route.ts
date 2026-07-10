import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthorisedCron } from "@/lib/cron-auth";

export async function GET(req: Request) {
  if (!isAuthorisedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = new Date();
  const results: Record<string, number> = {
    event_7day: 0,
    event_24hr: 0,
    unpaid_booking: 0,
    review_request: 0,
    pending_vendor_alert: 0,
    expired_quotes: 0,
  };

  // ── 1. Event 7-day reminders ──────────────────────────────────────────────
  const in7days = new Date(now);
  in7days.setDate(now.getDate() + 7);
  const in7daysStart = in7days.toISOString().slice(0, 10);
  const in7daysEnd = new Date(in7days.getTime() + 86400000).toISOString().slice(0, 10);

  const { data: events7day } = await supabase
    .from("events")
    .select("id, title, customer_id")
    .gte("date", in7daysStart)
    .lt("date", in7daysEnd)
    .not("status", "eq", "cancelled");

  for (const event of events7day ?? []) {
    await supabase.rpc("notify_user", {
      p_user_id: event.customer_id,
      p_title: `7 Days Until: ${event.title}`,
      p_message: `Your event "${event.title}" is in 7 days. Make sure all bookings are confirmed!`,
      p_type: "reminder",
      p_link: `/dashboard/events/${event.id}`,
    });
    await supabase.from("automation_logs").insert({
      type: "event_7day_reminder",
      target_id: event.id,
      target_type: "event",
      result: "sent",
    });
    results.event_7day++;
  }

  // ── 2. Event 24-hour reminders ────────────────────────────────────────────
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const dayAfter = new Date(tomorrow.getTime() + 86400000).toISOString().slice(0, 10);

  const { data: events24hr } = await supabase
    .from("events")
    .select("id, title, customer_id")
    .gte("date", tomorrowStr)
    .lt("date", dayAfter)
    .not("status", "eq", "cancelled");

  for (const event of events24hr ?? []) {
    await supabase.rpc("notify_user", {
      p_user_id: event.customer_id,
      p_title: `Tomorrow: ${event.title}`,
      p_message: `Your event is tomorrow! Check your bookings and confirm all arrangements.`,
      p_type: "reminder",
      p_link: `/dashboard/events/${event.id}`,
    });
    results.event_24hr++;
  }

  // ── 3. Unpaid booking reminders (accepted but no payment for 48hrs) ───────
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);

  const { data: unpaidBookings } = await supabase
    .from("bookings")
    .select("id, customer_id, deposit_amount, vendor:vendors(business_name)")
    .in("status", ["accepted", "confirmed", "pending_payment"])
    .eq("payment_status", "pending")
    .lt("created_at", twoDaysAgo.toISOString());

  for (const booking of unpaidBookings ?? []) {
    const vendorName = (booking.vendor as unknown as Record<string, string> | null)?.business_name ?? "your vendor";
    await supabase.rpc("notify_user", {
      p_user_id: booking.customer_id,
      p_title: "Deposit Payment Required",
      p_message: `Your booking with ${vendorName} requires a deposit of £${Number(booking.deposit_amount).toFixed(2)}. Pay now to secure your date.`,
      p_type: "payment",
      p_link: `/dashboard/bookings/${booking.id}`,
    });
    results.unpaid_booking++;
  }

  // ── 4. Review requests — triggered 3 days after event date ──────────────
  // Looks for confirmed bookings whose event date was exactly 3 days ago
  // and for which no review has been submitted yet. Does not require
  // booking.completed_at to be set (which requires a manual admin action).
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(now.getDate() - 4);

  const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 10);
  const fourDaysAgoStr  = fourDaysAgo.toISOString().slice(0, 10);

  const { data: reviewableBookings } = await supabase
    .from("bookings")
    .select(`
      id, customer_id, vendor_id,
      vendor:vendors(business_name),
      customer:profiles!bookings_customer_id_fkey(email, full_name),
      event:events(title, date)
    `)
    .in("status", ["confirmed", "completed"])
    .not("payment_status", "eq", "pending");

  for (const booking of reviewableBookings ?? []) {
    const eventData = booking.event as unknown as Record<string, string> | null;
    if (!eventData?.date) continue;

    const eventDateStr = eventData.date.slice(0, 10);
    if (eventDateStr < fourDaysAgoStr || eventDateStr > threeDaysAgoStr) continue;

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", booking.id)
      .maybeSingle();

    if (existingReview) continue;

    const { data: alreadyLogged } = await supabase
      .from("automation_logs")
      .select("id")
      .eq("type", "review_request")
      .eq("target_id", booking.id)
      .maybeSingle();

    if (alreadyLogged) continue;

    const customer = booking.customer as unknown as Record<string, string> | null;
    const vendorData = booking.vendor as unknown as Record<string, string> | null;
    const vendorBusiness = vendorData?.business_name ?? "your vendor";

    await supabase.rpc("notify_user", {
      p_user_id: booking.customer_id,
      p_title: "How did your event go?",
      p_message: `Leave a review for ${vendorBusiness}. It takes 60 seconds and helps other customers.`,
      p_type: "review",
      p_link: `/dashboard/bookings/${booking.id}?review=1`,
    });

    if (customer?.email) {
      const { sendReviewRequest } = await import("@/lib/resend");
      void sendReviewRequest(
        customer.email,
        customer.full_name ?? "there",
        vendorBusiness,
        booking.id
      );
    }

    await supabase.from("automation_logs").insert({
      type: "review_request",
      target_id: booking.id,
      target_type: "booking",
      result: "sent",
    });

    results.review_request++;
  }

  // ── 5. Admin alerts for long-pending vendor applications ─────────────────
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const { data: oldPendingVendors } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("status", "pending")
    .lt("created_at", sevenDaysAgo.toISOString());

  if ((oldPendingVendors?.length ?? 0) > 0) {
    await supabase.from("automation_logs").insert({
      type: "admin_pending_vendor_alert",
      result: "sent",
      metadata: { count: oldPendingVendors!.length },
    });
    results.pending_vendor_alert = oldPendingVendors!.length;
  }

  // ── 6. Expire old quotes ──────────────────────────────────────────────────
  const { data: expiredQuotes } = await supabase
    .from("quotes")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", now.toISOString())
    .select("id");

  results.expired_quotes = expiredQuotes?.length ?? 0;

  return NextResponse.json({ success: true, processed: results, timestamp: now.toISOString() });
}
