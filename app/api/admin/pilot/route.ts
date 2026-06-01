import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

function periodToInterval(period: string): string {
  switch (period) {
    case "24h":  return "24 hours";
    case "7d":   return "7 days";
    case "30d":  return "30 days";
    default:     return "30 days";
  }
}

function periodToDate(period: string): string {
  const now = new Date();
  switch (period) {
    case "24h": now.setHours(now.getHours() - 24); break;
    case "7d":  now.setDate(now.getDate() - 7); break;
    default:    now.setDate(now.getDate() - 30); break;
  }
  return now.toISOString();
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_EMAILS.includes(user.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30d";
  const since  = periodToDate(period);

  const db = await createAdminClient();

  const [
    quotesRes,
    bookingsRes,
    vendorsRes,
    customersRes,
    reviewsRes,
    eventsRes,
    activityQuotesRes,
    activityBookingsRes,
    activityVendorsRes,
    activityReviewsRes,
  ] = await Promise.all([
    // Quotes in period
    db.from("quotes")
      .select("id, status, created_at, responded_at, accepted_at")
      .gte("created_at", since),

    // Bookings in period
    db.from("bookings")
      .select("id, status, total_amount, commission_amount, created_at")
      .gte("created_at", since),

    // New vendors in period
    db.from("vendors")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),

    // New customers in period
    db.from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", since),

    // New reviews in period
    db.from("reviews")
      .select("id, rating", { count: "exact" })
      .gte("created_at", since),

    // New events in period
    db.from("events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),

    // Activity: quotes last 24h
    db.from("quotes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodToDate("24h")),

    // Activity: bookings last 24h
    db.from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodToDate("24h")),

    // Activity: vendor registrations last 24h
    db.from("vendors")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodToDate("24h")),

    // Activity: reviews last 24h
    db.from("reviews")
      .select("id", { count: "exact", head: true })
      .gte("created_at", periodToDate("24h")),
  ]);

  const quotes    = quotesRes.data ?? [];
  const bookings  = bookingsRes.data ?? [];

  const quotesRequested = quotes.length;
  const quotesSubmitted = quotes.filter((q) => q.responded_at != null).length;
  const quotesAccepted  = quotes.filter((q) =>
    ["accepted", "converted"].includes(q.status)
  ).length;

  const bookingsCreated = bookings.length;
  const revenueTotal    = bookings
    .filter((b) => ["confirmed", "completed"].includes(b.status))
    .reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
  const platformRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.commission_amount != null ? b.commission_amount : (b.total_amount ?? 0) * 0.1), 0);

  const avgReview = reviewsRes.data && reviewsRes.data.length > 0
    ? reviewsRes.data.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewsRes.data.length
    : null;

  return NextResponse.json({
    period,
    since,
    kpis: {
      quotesRequested,
      quotesSubmitted,
      quotesAccepted,
      bookingsCreated,
      revenueTotal,
      platformRevenue,
      newVendors:   vendorsRes.count   ?? 0,
      newCustomers: customersRes.count ?? 0,
      newReviews:   reviewsRes.count   ?? 0,
      newEvents:    eventsRes.count    ?? 0,
      avgReviewRating: avgReview,
    },
    activity: {
      quotes24h:   activityQuotesRes.count    ?? 0,
      bookings24h: activityBookingsRes.count  ?? 0,
      vendors24h:  activityVendorsRes.count   ?? 0,
      reviews24h:  activityReviewsRes.count   ?? 0,
      // 7-day = period data when period = 7d; else re-use period data
      quotes7d:   period === "7d" ? quotesRequested : 0,
      bookings7d: period === "7d" ? bookingsCreated : 0,
    },
  });
}
