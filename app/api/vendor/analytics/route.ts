import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7); // "YYYY-MM"
}

function weekBucket(iso: string, anchorMs: number): number {
  // Which 7-day bucket (0 = oldest, 11 = newest of 12 weeks)
  const diffMs = anchorMs - new Date(iso).getTime();
  const weekIndex = 11 - Math.floor(diffMs / (7 * 86400000));
  return Math.max(0, Math.min(11, weekIndex));
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, profile_views, rating, review_count")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days  = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Time windows for new metrics
  const nowMs = Date.now();
  const now   = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
  const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  // two months of analytics events for MoM view comparison
  const twoMonthsAgo   = prevMonthStart;

  // ── All queries in parallel ─────────────────────────────────────────────────
  const [
    analyticsRes,
    bookingsRes,
    quotesRes,
    reviewsRes,
    trendBookingsRes,
    allQuotesRes,
    momAnalyticsRes,
    directContactsRes,
  ] = await Promise.all([
    // Existing: period-scoped
    supabase.from("vendor_analytics").select("event_type, created_at").eq("vendor_id", vendor.id).gte("created_at", since),
    supabase.from("bookings").select("id, status, total_amount, created_at").eq("vendor_id", vendor.id).gte("created_at", since),
    supabase.from("quotes").select("id, status, created_at").eq("vendor_id", vendor.id).gte("created_at", since),
    supabase.from("reviews").select("rating, created_at").eq("vendor_id", vendor.id).gte("created_at", since),

    // New: 12-month bookings for trend + MoM + avg value + payout split (Phase 69A)
    supabase
      .from("bookings")
      .select("total_amount, vendor_payout, created_at, status, payment_status, booking_source")
      .eq("vendor_id", vendor.id)
      .gte("created_at", twelveMonthsAgo),

    // New: all-time quotes for funnel + seasonal demand + MoM quotes (Phase 69A)
    supabase
      .from("quotes")
      .select("id, status, event_date, created_at")
      .eq("vendor_id", vendor.id),

    // New: 2-month analytics for MoM view comparison (Phase 69A)
    supabase
      .from("vendor_analytics")
      .select("event_type, created_at")
      .eq("vendor_id", vendor.id)
      .gte("created_at", twoMonthsAgo),

    // Phase 69C Stage A: direct contacts count
    supabase
      .from("manual_contacts")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .eq("is_archived", false),
  ]);

  // ── Existing metrics (unchanged) ───────────────────────────────────────────
  const analytics = analyticsRes.data ?? [];
  const bookings  = bookingsRes.data ?? [];
  const quotes    = quotesRes.data ?? [];
  const reviews   = reviewsRes.data ?? [];

  const profileViews      = analytics.filter((a) => a.event_type === "profile_view").length;
  const showcaseViews     = analytics.filter((a) => a.event_type === "showcase_view").length;
  const quoteRequests     = quotes.length;
  const confirmedBookings = bookings.filter((b) => ["confirmed", "accepted", "completed"].includes(b.status)).length;
  const revenue           = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
  const conversionRate    = quoteRequests > 0 ? Math.round((confirmedBookings / quoteRequests) * 100) : 0;
  const avgRatingVal      = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : vendor.rating;

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d       = new Date(Date.now() - (13 - i) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      date:     dateStr,
      views:    analytics.filter((a) => a.created_at.slice(0, 10) === dateStr && a.event_type === "profile_view").length,
      bookings: bookings.filter((b) => b.created_at.slice(0, 10) === dateStr).length,
    };
  });

  // ── NEW: Revenue trend ─────────────────────────────────────────────────────
  const trendBookings = trendBookingsRes.data ?? [];
  const confirmedTrend = trendBookings.filter((b) => ["confirmed", "accepted", "completed"].includes(b.status));

  // Monthly (12 months)
  const monthBuckets: Record<string, { gross: number; net: number; count: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets[d.toISOString().slice(0, 7)] = { gross: 0, net: 0, count: 0 };
  }
  for (const b of confirmedTrend) {
    const key = monthKey(b.created_at);
    if (monthBuckets[key]) {
      const gross = Number(b.total_amount ?? 0);
      const net   = Number(b.vendor_payout ?? 0) || gross * 0.9;
      monthBuckets[key].gross += gross;
      monthBuckets[key].net   += net;
      monthBuckets[key].count += 1;
    }
  }
  const revenueTrendMonthly = Object.entries(monthBuckets).map(([month, v]) => ({
    month,
    label: MONTH_NAMES[parseInt(month.slice(5, 7), 10) - 1],
    gross: Math.round(v.gross * 100) / 100,
    net:   Math.round(v.net   * 100) / 100,
    count: v.count,
  }));

  // Weekly (12 weeks)
  const weekBucketData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(nowMs - (11 - i) * 7 * 86400000);
    return {
      week_start: weekStart.toISOString().slice(0, 10),
      label: `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]}`,
      gross: 0, net: 0, count: 0,
    };
  });
  for (const b of confirmedTrend) {
    const idx = weekBucket(b.created_at, nowMs);
    if (idx >= 0 && idx < 12) {
      const gross = Number(b.total_amount ?? 0);
      const net   = Number(b.vendor_payout ?? 0) || gross * 0.9;
      weekBucketData[idx].gross += gross;
      weekBucketData[idx].net   += net;
      weekBucketData[idx].count += 1;
    }
  }
  const revenueTrendWeekly = weekBucketData.map((w) => ({
    ...w,
    gross: Math.round(w.gross * 100) / 100,
    net:   Math.round(w.net   * 100) / 100,
  }));

  // ── NEW: Month-over-Month comparison ───────────────────────────────────────
  const momAnalytics = momAnalyticsRes.data ?? [];

  const thisBookings = trendBookings.filter((b) => b.created_at >= thisMonthStart && ["confirmed","accepted","completed"].includes(b.status));
  const prevBookings = trendBookings.filter((b) => b.created_at >= prevMonthStart && b.created_at < thisMonthStart && ["confirmed","accepted","completed"].includes(b.status));

  const thisRevenue  = thisBookings.reduce((s, b) => s + (Number(b.vendor_payout ?? 0) || Number(b.total_amount ?? 0) * 0.9), 0);
  const prevRevenue  = prevBookings.reduce((s, b) => s + (Number(b.vendor_payout ?? 0) || Number(b.total_amount ?? 0) * 0.9), 0);

  const thisViews = momAnalytics.filter((a) => a.created_at >= thisMonthStart && a.event_type === "profile_view").length;
  const prevViews = momAnalytics.filter((a) => a.created_at >= prevMonthStart && a.created_at < thisMonthStart && a.event_type === "profile_view").length;

  const allQuotesRaw = allQuotesRes.data ?? [];
  const thisQuotes = allQuotesRaw.filter((q) => q.created_at >= thisMonthStart).length;
  const prevQuotes = allQuotesRaw.filter((q) => q.created_at >= prevMonthStart && q.created_at < thisMonthStart).length;

  const mom = {
    current_month: {
      revenue:  Math.round(thisRevenue * 100) / 100,
      bookings: thisBookings.length,
      quotes:   thisQuotes,
      views:    thisViews,
    },
    previous_month: {
      revenue:  Math.round(prevRevenue * 100) / 100,
      bookings: prevBookings.length,
      quotes:   prevQuotes,
      views:    prevViews,
    },
    changes: {
      revenue_pct:  pct(thisRevenue,        prevRevenue),
      bookings_pct: pct(thisBookings.length, prevBookings.length),
      quotes_pct:   pct(thisQuotes,          prevQuotes),
      views_pct:    pct(thisViews,           prevViews),
    },
  };

  // ── NEW: Average booking value ─────────────────────────────────────────────
  const allConfirmed = trendBookings.filter((b) => ["confirmed","accepted","completed"].includes(b.status));
  const avgBookingValue = allConfirmed.length > 0
    ? Math.round((allConfirmed.reduce((s, b) => s + Number(b.total_amount ?? 0), 0) / allConfirmed.length) * 100) / 100
    : null;

  // ── NEW: Lead funnel ───────────────────────────────────────────────────────
  const RESPONDED_STATUSES = ["responded","viewed","shortlisted","accepted","rejected","converted","declined"];
  const ACCEPTED_STATUSES  = ["accepted","converted"];

  const totalLeads   = allQuotesRaw.length;
  const responded    = allQuotesRaw.filter((q) => RESPONDED_STATUSES.includes(q.status)).length;
  const accepted     = allQuotesRaw.filter((q) => ACCEPTED_STATUSES.includes(q.status)).length;
  const converted    = allQuotesRaw.filter((q) => q.status === "converted").length;
  const responseRate = totalLeads > 0 ? Math.round((responded / totalLeads) * 100) : 0;

  const leadFunnel = { total_leads: totalLeads, responded, accepted, converted, response_rate: responseRate };

  // ── NEW: Seasonal demand ───────────────────────────────────────────────────
  const monthlyCounts = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    month_short: MONTH_NAMES[i],
    count: 0,
  }));
  for (const q of allQuotesRaw) {
    const ed = q.event_date;
    if (ed) {
      const m = new Date(ed).getMonth(); // 0-11
      if (m >= 0 && m < 12) monthlyCounts[m].count++;
    }
  }

  // ── NEW: Payout split ──────────────────────────────────────────────────────
  // received: payment fully cleared; pending: confirmed but not yet fully paid; not_yet_due: pre-payment stage
  const netOf = (b: { vendor_payout?: number | null; total_amount?: number | null }) =>
    Number(b.vendor_payout ?? 0) || Number(b.total_amount ?? 0) * 0.9;
  const payoutReceived  = trendBookings.filter((b) => b.payment_status === "fully_paid").reduce((s, b) => s + netOf(b), 0);
  const payoutPending   = trendBookings.filter((b) => b.status === "confirmed" && b.payment_status !== "fully_paid").reduce((s, b) => s + netOf(b), 0);
  const payoutNotYetDue = trendBookings.filter((b) => ["pending","accepted"].includes(b.status)).reduce((s, b) => s + netOf(b), 0);

  const payoutSplit = {
    received:      Math.round(payoutReceived  * 100) / 100,
    pending:       Math.round(payoutPending   * 100) / 100,
    not_yet_due:   Math.round(payoutNotYetDue * 100) / 100,
  };

  const directContactsCount = directContactsRes.count ?? 0;

  return NextResponse.json({
    // ── Existing (unchanged) ──────────────────────────────────────────────────
    summary: {
      profile_views:       profileViews,
      showcase_views:      showcaseViews,
      quote_requests:      quoteRequests,
      confirmed_bookings:  confirmedBookings,
      revenue,
      conversion_rate:     conversionRate,
      avg_rating:          Number(avgRatingVal.toFixed(1)),
      total_reviews:       reviews.length,
    },
    chart: last14,
    event_breakdown: {
      profile_view:  analytics.filter((a) => a.event_type === "profile_view").length,
      showcase_view: analytics.filter((a) => a.event_type === "showcase_view").length,
      quote_request: analytics.filter((a) => a.event_type === "quote_request").length,
      media_view:    analytics.filter((a) => a.event_type === "media_view").length,
    },

    // ── New (Phase 69A) ───────────────────────────────────────────────────────
    revenue_trend: {
      monthly: revenueTrendMonthly,
      weekly:  revenueTrendWeekly,
    },
    mom,
    avg_booking_value: avgBookingValue,
    lead_funnel:       leadFunnel,
    seasonal_demand:   monthlyCounts,
    payout_split:      payoutSplit,

    // ── New (Phase 69C Stage A) ───────────────────────────────────────────────
    direct_contacts_count: directContactsCount,
  });
}

// ── POST (unchanged) ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { vendor_id, event_type } = await req.json() as { vendor_id: string; event_type: string };
  if (!vendor_id || !event_type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const ALLOWED_EVENTS = ["profile_view", "showcase_view", "quote_request", "media_view"];
  if (!ALLOWED_EVENTS.includes(event_type)) {
    return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  }

  await supabase.from("vendor_analytics").insert({
    vendor_id,
    event_type,
    visitor_id: user?.id ?? null,
  });

  return NextResponse.json({ success: true });
}
