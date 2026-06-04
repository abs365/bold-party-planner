// ── Vendor Reputation Engine ──────────────────────────────────────────────────
//
// Reputation score (0–100) is distinct from the ranking score (lib/vendor/ranking.ts).
// It is outcome-based: built entirely from verified review data, sub-ratings,
// and behavioural signals rather than profile completeness.
//
// Trust tier thresholds:
//   new         < 5 reviews              entry state
//   trusted     5+ reviews, score ≥ 50   established credibility
//   top_rated   15+ reviews, score ≥ 75  proven excellence
//   exceptional 30+ reviews, score ≥ 90  elite status

export type TrustTier = "new" | "trusted" | "top_rated" | "exceptional";

export interface SubRatingAverages {
  communication:   number | null;
  professionalism: number | null;
  punctuality:     number | null;
  quality:         number | null;
  value:           number | null;
}

export interface VendorReputationScore {
  score:           number;        // 0–100
  tier:            TrustTier;
  tierLabel:       string;
  tierBadgeClass:  string;
  components: {
    ratingQuality:    number;     // 0–35
    reviewVolume:     number;     // 0–20
    subRatingBonus:   number;     // 0–15
    responseBonus:    number;     // 0–10
    reliabilityBonus: number;     // 0–10
    recencyBonus:     number;     // 0–10
  };
  subRatings: SubRatingAverages;
}

export interface ReputationInput {
  rating:               number;
  review_count:         number;
  verified_review_count?: number;
  response_rate:        number | null;
  cancellation_rate:    number | null;
  completed_jobs_count: number;
  repeat_customer_count?: number;
  // sub-rating averages (pre-computed or computed below)
  avg_communication?:   number | null;
  avg_professionalism?: number | null;
  avg_punctuality?:     number | null;
  avg_quality?:         number | null;
  avg_value?:           number | null;
}

const TIER_META: Record<TrustTier, { label: string; badgeClass: string; minReviews: number; minScore: number }> = {
  new:         { label: "New",          badgeClass: "bg-slate-50 text-slate-500 border-slate-200",     minReviews: 0,  minScore: 0  },
  trusted:     { label: "Trusted",      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",        minReviews: 5,  minScore: 50 },
  top_rated:   { label: "Top Rated",    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",     minReviews: 15, minScore: 75 },
  exceptional: { label: "Exceptional",  badgeClass: "bg-slate-50 text-[#0B1F4D] border-slate-200",  minReviews: 30, minScore: 90 },
};

function resolveTier(score: number, reviewCount: number): TrustTier {
  if (reviewCount >= 30 && score >= 90) return "exceptional";
  if (reviewCount >= 15 && score >= 75) return "top_rated";
  if (reviewCount >= 5  && score >= 50) return "trusted";
  return "new";
}

export function calculateVendorReputation(vendor: ReputationInput): VendorReputationScore {
  const rating      = vendor.rating ?? 0;
  const reviews     = vendor.review_count ?? 0;
  const verReviews  = vendor.verified_review_count ?? reviews;
  const respRate    = vendor.response_rate ?? 0;
  const cancelRate  = vendor.cancellation_rate ?? 0;
  const jobs        = vendor.completed_jobs_count ?? 0;
  const repeats     = vendor.repeat_customer_count ?? 0;

  // Rating quality: 0–35 (penalised heavily below 4.0)
  const ratingQuality = rating >= 4.0
    ? ((rating - 4.0) / 1.0) * 20 + 15   // 4.0→15, 5.0→35
    : Math.max(0, (rating / 4.0) * 15);    // <4.0 → 0–15

  // Review volume: 0–20 (log scale, 50 verified reviews = full 20 pts)
  const reviewVolume = reviews > 0
    ? Math.min((Math.log2(verReviews + 1) / Math.log2(51)), 1) * 20
    : 0;

  // Sub-rating bonus: 0–15 (average of available sub-ratings, scaled)
  const subAvgs = [
    vendor.avg_communication,
    vendor.avg_professionalism,
    vendor.avg_punctuality,
    vendor.avg_quality,
    vendor.avg_value,
  ].filter((v): v is number => v !== null && v !== undefined);

  const subRatingBonus = subAvgs.length > 0
    ? ((subAvgs.reduce((a, b) => a + b, 0) / subAvgs.length - 1) / 4) * 15
    : 0;

  // Response bonus: 0–10
  const responseBonus = (respRate / 100) * 10;

  // Reliability bonus: 0–10
  // High jobs + low cancellation + repeat customers
  const jobPts      = Math.min(jobs / 30, 1) * 5;
  const cancelPts   = cancelRate < 5 ? 3 : cancelRate < 10 ? 1.5 : 0;
  const repeatPts   = Math.min(repeats / 5, 1) * 2;
  const reliabilityBonus = jobPts + cancelPts + repeatPts;

  // Recency bonus: 0–10 — placeholder (full signal requires recent review dates)
  // Conservative: give 5 pts if they have verified reviews
  const recencyBonus = verReviews > 0 ? 5 : 0;

  const rawScore =
    ratingQuality + reviewVolume + subRatingBonus +
    responseBonus + reliabilityBonus + recencyBonus;

  const score = Math.min(100, Math.round(rawScore));
  const tier  = resolveTier(score, reviews);
  const { label: tierLabel, badgeClass: tierBadgeClass } = TIER_META[tier];

  return {
    score,
    tier,
    tierLabel,
    tierBadgeClass,
    components: {
      ratingQuality:    Math.round(ratingQuality    * 10) / 10,
      reviewVolume:     Math.round(reviewVolume     * 10) / 10,
      subRatingBonus:   Math.round(subRatingBonus   * 10) / 10,
      responseBonus:    Math.round(responseBonus    * 10) / 10,
      reliabilityBonus: Math.round(reliabilityBonus * 10) / 10,
      recencyBonus,
    },
    subRatings: {
      communication:   vendor.avg_communication   ?? null,
      professionalism: vendor.avg_professionalism ?? null,
      punctuality:     vendor.avg_punctuality     ?? null,
      quality:         vendor.avg_quality         ?? null,
      value:           vendor.avg_value           ?? null,
    },
  };
}

// ── Customer satisfaction signal ─────────────────────────────────────────────
// Returns a 0–100 score based solely on sub-rating data.
// Used to surface the "Customer Favourite" badge.

export interface CustomerSatisfactionInput {
  avg_communication?:   number | null;
  avg_professionalism?: number | null;
  avg_punctuality?:     number | null;
  avg_quality?:         number | null;
  avg_value?:           number | null;
  review_count:         number;
}

export function calculateCustomerSatisfaction(input: CustomerSatisfactionInput): number {
  if (input.review_count < 3) return 0;
  const avgs = [
    input.avg_communication,
    input.avg_professionalism,
    input.avg_punctuality,
    input.avg_quality,
    input.avg_value,
  ].filter((v): v is number => v !== null && v !== undefined);
  if (avgs.length === 0) return 0;
  const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  return Math.round(((mean - 1) / 4) * 100);
}

// ── Review trust score ────────────────────────────────────────────────────────
// Per-review signal for how much weight to give it.
// Used in admin moderation prioritisation.

export interface ReviewTrustInput {
  is_verified:      boolean;
  has_sub_ratings:  boolean;  // at least 3 sub-ratings provided
  comment_length:   number;
  rating:           number;
  vendor_rating:    number;   // vendor's current avg — outlier detection
}

export function calculateReviewTrustScore(input: ReviewTrustInput): number {
  let score = 0;

  // Verified booking carries most of the weight
  if (input.is_verified) score += 50;

  // Detailed sub-ratings signal genuine effort
  if (input.has_sub_ratings) score += 20;

  // Substantive comment
  if (input.comment_length >= 100) score += 15;
  else if (input.comment_length >= 40) score += 8;
  else if (input.comment_length >= 10) score += 3;

  // Extreme outlier detection: flag if >2 stars away from vendor avg
  const delta = Math.abs(input.rating - input.vendor_rating);
  if (delta > 2) score -= 10;
  else if (delta > 1.5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export { TIER_META };
