// AI Automation Layer — Phase 1 (Rule-Based)
// Replace individual functions with ML models as data grows

export const SCORING_WEIGHTS = {
  // Vendor scoring (0–100)
  vendor: {
    rating: 40,       // Normalised 0–5 → 0–40
    reviewCount: 20,  // Capped at 50 reviews → 0–20
    responseRate: 25, // 0–1 → 0–25
    experience: 15,   // Capped at 10 years → 0–15
  },
  // Lead scoring (0–100)
  lead: {
    budget: 40,       // Budget ≥ £5 000 → full 40 pts
    guestCount: 30,   // Guest count ≥ 200 → full 30 pts
    futureDate: 30,   // Event ≥ 90 days out → full 30 pts
  },
} as const;

export type ScoringWeights = typeof SCORING_WEIGHTS;

/**
 * Score a vendor on a 0–100 scale based on quality signals.
 * Higher = more likely to convert and satisfy customers.
 */
export function scoreVendor(vendor: {
  rating: number;
  review_count: number;
  response_rate?: number;
  years_experience?: number;
}): number {
  const ratingScore = (Math.min(Math.max(vendor.rating, 0), 5) / 5) * SCORING_WEIGHTS.vendor.rating;
  const reviewScore =
    (Math.min(vendor.review_count, 50) / 50) * SCORING_WEIGHTS.vendor.reviewCount;
  const responseScore =
    (Math.min(Math.max(vendor.response_rate ?? 0.5, 0), 1)) *
    SCORING_WEIGHTS.vendor.responseRate;
  const experienceScore =
    (Math.min(vendor.years_experience ?? 0, 10) / 10) * SCORING_WEIGHTS.vendor.experience;

  return Math.round(ratingScore + reviewScore + responseScore + experienceScore);
}

/**
 * Score a lead on a 0–100 scale.
 * Higher budget + more guests + further future date = higher priority lead.
 */
export function scoreLead(quote: {
  budget_max?: number | null;
  guest_count?: number | null;
  event_date?: string | null;
}): number {
  const budgetScore =
    (Math.min(quote.budget_max ?? 0, 5000) / 5000) * SCORING_WEIGHTS.lead.budget;

  const guestScore =
    (Math.min(quote.guest_count ?? 0, 200) / 200) * SCORING_WEIGHTS.lead.guestCount;

  let futureScore = 0;
  if (quote.event_date) {
    const daysUntil = Math.max(
      0,
      (new Date(quote.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    futureScore = (Math.min(daysUntil, 90) / 90) * SCORING_WEIGHTS.lead.futureDate;
  }

  return Math.round(budgetScore + guestScore + futureScore);
}
