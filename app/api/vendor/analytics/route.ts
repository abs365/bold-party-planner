import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id, profile_views, rating, review_count").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [analyticsRes, bookingsRes, quotesRes, reviewsRes] = await Promise.all([
    supabase
      .from("vendor_analytics")
      .select("event_type, created_at")
      .eq("vendor_id", vendor.id)
      .gte("created_at", since),
    supabase
      .from("bookings")
      .select("id, status, total_amount, created_at")
      .eq("vendor_id", vendor.id)
      .gte("created_at", since),
    supabase
      .from("quotes")
      .select("id, status, created_at")
      .eq("vendor_id", vendor.id)
      .gte("created_at", since),
    supabase
      .from("reviews")
      .select("rating, created_at")
      .eq("vendor_id", vendor.id)
      .gte("created_at", since),
  ]);

  const analytics = analyticsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const profileViews  = analytics.filter((a) => a.event_type === "profile_view").length;
  const showcaseViews = analytics.filter((a) => a.event_type === "showcase_view").length;
  const quoteRequests = quotes.length;
  const confirmedBookings = bookings.filter((b) => ["confirmed", "accepted", "completed"].includes(b.status)).length;
  const revenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.total_amount, 0);
  const conversionRate = quoteRequests > 0 ? Math.round((confirmedBookings / quoteRequests) * 100) : 0;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : vendor.rating;

  // Daily breakdown for chart (last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      date: dateStr,
      views: analytics.filter((a) => a.created_at.slice(0, 10) === dateStr && a.event_type === "profile_view").length,
      bookings: bookings.filter((b) => b.created_at.slice(0, 10) === dateStr).length,
    };
  });

  return NextResponse.json({
    summary: {
      profile_views:  profileViews,
      showcase_views: showcaseViews,
      quote_requests: quoteRequests,
      confirmed_bookings: confirmedBookings,
      revenue,
      conversion_rate: conversionRate,
      avg_rating: Number(avgRating.toFixed(1)),
      total_reviews: reviews.length,
    },
    chart: last14,
    event_breakdown: {
      profile_view:  analytics.filter((a) => a.event_type === "profile_view").length,
      showcase_view: analytics.filter((a) => a.event_type === "showcase_view").length,
      quote_request: analytics.filter((a) => a.event_type === "quote_request").length,
      media_view:    analytics.filter((a) => a.event_type === "media_view").length,
    },
  });
}

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
