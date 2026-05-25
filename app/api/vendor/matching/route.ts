import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventType = searchParams.get("event_type") ?? "";
  const city = searchParams.get("city") ?? "";
  const budgetMin = parseFloat(searchParams.get("budget_min") ?? "0");
  const budgetMax = parseFloat(searchParams.get("budget_max") ?? "999999");
  const category = searchParams.get("category") ?? "";
  const eventId = searchParams.get("event_id") ?? "";

  let query = supabase
    .from("vendors")
    .select(`
      id, business_name, category, city, rating, review_count, bio, tagline,
      min_price, max_price, verified, featured, years_experience, event_types,
      travel_radius_km,
      media:vendor_media(url, is_cover, type),
      packages:vendor_packages(id, name, price, includes)
    `)
    .eq("status", "approved");

  if (category) query = query.eq("category", category);

  const { data: vendors, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get existing bookings to exclude vendors already booked for this event
  let bookedVendorIds = new Set<string>();
  if (eventId) {
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("vendor_id")
      .eq("event_id", eventId)
      .not("status", "in", '("cancelled","disputed")');
    bookedVendorIds = new Set((existingBookings ?? []).map((b) => b.vendor_id));
  }

  // Scoring algorithm
  const scored = (vendors ?? [])
    .filter((v) => !bookedVendorIds.has(v.id))
    .map((vendor) => {
      let score = 0;

      // Rating score (0-30 points)
      score += (vendor.rating ?? 0) * 6;

      // Verified bonus (10 points)
      if (vendor.verified) score += 10;

      // Featured bonus (5 points)
      if (vendor.featured) score += 5;

      // City match (20 points)
      if (city && vendor.city?.toLowerCase().includes(city.toLowerCase())) score += 20;

      // Event type match (15 points)
      if (eventType && Array.isArray(vendor.event_types) && vendor.event_types.includes(eventType)) {
        score += 15;
      }

      // Budget fit (15 points) — at least one package in range
      const packages = Array.isArray(vendor.packages) ? vendor.packages : [];
      const hasPackageInBudget = packages.some((pkg: Record<string, unknown>) => {
        const price = Number(pkg.price ?? 0);
        return price >= budgetMin && price <= budgetMax;
      });
      if (hasPackageInBudget) score += 15;
      else if (vendor.min_price && vendor.min_price <= budgetMax) score += 7;

      // Profile completeness (5 points)
      let completeness = 0;
      if (vendor.bio) completeness++;
      if (vendor.tagline) completeness++;
      if (Array.isArray(vendor.media) && vendor.media.length > 0) completeness++;
      if (packages.length > 0) completeness++;
      if (vendor.years_experience) completeness++;
      score += completeness;

      // Review count bonus (up to 5 points)
      score += Math.min(vendor.review_count ?? 0, 5);

      return { ...vendor, match_score: Math.round(score) };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 20);

  return NextResponse.json(scored);
}
