import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";

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
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30d";
  const since  = periodToDate(period);

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
    auth.db.from("quotes").select("id, status, created_at, responded_at, accepted_at").gte("created_at", since),
    auth.db.from("bookings").select("id, status, total_amount, commission_amount, created_at").gte("created_at", since),
    auth.db.from("vendors").select("id", { count: "exact", head: true }).gte("created_at", since),
    auth.db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", since),
    auth.db.from("reviews").select("id, rating", { count: "exact" }).gte("created_at", since),
    auth.db.from("events").select("id", { count: "exact", head: true }).gte("created_at", since),
    auth.db.from("quotes").select("id", { count: "exact", head: true }).gte("created_at", periodToDate("24h")),
    auth.db.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", periodToDate("24h")),
    auth.db.from("vendors").select("id", { count: "exact", head: true }).gte("created_at", periodToDate("24h")),
    auth.db.from("reviews").select("id", { count: "exact", head: true }).gte("created_at", periodToDate("24h")),
  ]);

  const quotes    = quotesRes.data ?? [];
  const bookings  = bookingsRes.data ?? [];

  const quotesRequested = quotes.length;
  const quotesSubmitted = quotes.filter((q) => q.responded_at != null).length;
  const quotesAccepted  = quotes.filter((q) => ["accepted", "converted"].includes(q.status)).length;

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
      quotes7d:   period === "7d" ? quotesRequested : 0,
      bookings7d: period === "7d" ? bookingsCreated : 0,
    },
  });
}
