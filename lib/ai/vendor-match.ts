// AI Automation Layer — Phase 1 (Rule-Based)
// Replace individual functions with ML models as data grows

// TODO: Replace with embedding-based semantic matching once vendor corpus is large enough.
// Each vendor profile + event description should be embedded and compared via cosine similarity.

import { createClient } from "@/lib/supabase/server";

export interface VendorMatchParams {
  eventType: string;
  city: string;
  category: string;
  budget?: number | null;
  guestCount?: number | null;
  date?: string | null;
}

export interface VendorMatchScore {
  vendorId: string;
  businessName: string;
  score: number;
  breakdown: {
    ratingScore: number;
    proximityScore: number;
    availabilityScore: number;
    responseRateScore: number;
  };
}

/**
 * Score formula (rule-based — Phase 1):
 *   rating * 40 + proximity_score * 30 + availability_score * 20 + response_rate * 10
 *
 * Returns vendors sorted by score descending.
 */
export async function matchVendorsForEvent(
  params: VendorMatchParams
): Promise<VendorMatchScore[]> {
  const supabase = await createClient();

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select(
      "id, business_name, category, city, rating, review_count, response_rate, years_experience, status"
    )
    .eq("category", params.category)
    .eq("status", "approved");

  if (error || !vendors) return [];

  const scored: VendorMatchScore[] = vendors.map((v) => {
    // Proximity: exact city match = 1.0, otherwise 0.3 (no geo API yet)
    const proximityScore = v.city?.toLowerCase() === params.city?.toLowerCase() ? 1.0 : 0.3;

    // Availability: no real calendar yet — default optimistic 0.8
    const availabilityScore = 0.8;

    const responseRate = typeof v.response_rate === "number" ? v.response_rate : 0.5;

    const ratingNorm = (Math.min(Math.max(v.rating ?? 0, 0), 5) / 5) * 40;
    const proximityNorm = proximityScore * 30;
    const availabilityNorm = availabilityScore * 20;
    const responseNorm = responseRate * 10;

    const totalScore = Math.round(ratingNorm + proximityNorm + availabilityNorm + responseNorm);

    return {
      vendorId: v.id,
      businessName: v.business_name,
      score: totalScore,
      breakdown: {
        ratingScore: Math.round(ratingNorm),
        proximityScore: Math.round(proximityNorm),
        availabilityScore: Math.round(availabilityNorm),
        responseRateScore: Math.round(responseNorm),
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
