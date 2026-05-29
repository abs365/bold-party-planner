import { getPlanVisibilityBoost } from "@/lib/vendor/entitlements";

// ── Vendor Marketplace Ranking Engine ────────────────────────────────────────
//
// Scoring model (raw max = 95, normalized to 0–100):
//
//   Rating quality      0–25   avg_rating / 5 × 25
//   Review volume       0–8    log₂ scale, 100 reviews = full 8 pts
//   Verification level  0–20   L0=0  L1=6  L2=12  L3=17  L4=20
//   Activity            0–15   completed_jobs × 0.3, capped at 50 jobs
//   Responsiveness      0–12   response_rate / 100 × 12
//   Profile quality     0–10   bio(2) + phone(2) + city(2) + social(2) + packages(2)
//   Reputation bonus    0–5    reputation_score / 100 × 5 (from verified reviews)
//   Cancellation pen.   0–10   deducted: cancellation_rate / 100 × 10
//
// Visibility tiers (normalized score):
//   90–100  priority   — Top Vendor
//   70–89   standard   — Standard
//   50–69   reduced    — Building Profile
//    0–49   limited    — New Vendor
//
// `featured` is NOT part of the quality score — it is a business placement
// decision applied as a sort boost in calculateMarketplaceRank().

export interface RankingFactors {
  rating: number;
  reviews: number;
  verification: number;
  activity: number;
  responsiveness: number;
  profile: number;
  reputation: number;
  penalty: number;
}

export type VisibilityTier = "priority" | "standard" | "reduced" | "limited";

export interface VendorRankScore {
  raw: number;
  total: number;
  factors: RankingFactors;
  tier: VisibilityTier;
  tierLabel: string;
  tierBadgeClass: string;
}

export interface VendorRankInput {
  rating: number;
  review_count: number;
  verification_level: number;
  verified: boolean;
  completed_jobs_count: number;
  response_rate: number | null;
  cancellation_rate: number | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  instagram_url: string | null;
  website_url: string | null;
  featured: boolean;
  reputation_score?: number;
  // Subscription context — used for governance-gated sort boost only
  subscription_plan?: string | null;
  status?: string;           // vendor status for governance gating
  suspicious_flag?: boolean;
  media?: unknown[];
  packages?: unknown[];
  created_at?: string;
}

const RAW_MAX = 95;

const VERIFICATION_PTS: Record<number, number> = { 0: 0, 1: 6, 2: 12, 3: 17, 4: 20 };

const TIER_CONFIG: Record<VisibilityTier, { label: string; badgeClass: string }> = {
  priority: { label: "Top Vendor",        badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  standard: { label: "Standard",          badgeClass: "bg-gray-50 text-gray-600 border-gray-200" },
  reduced:  { label: "Building Profile",  badgeClass: "bg-slate-50 text-slate-500 border-slate-200" },
  limited:  { label: "New Vendor",        badgeClass: "bg-slate-50 text-slate-400 border-slate-200" },
};

export function calculateVendorScore(vendor: VendorRankInput): VendorRankScore {
  const rating        = vendor.rating ?? 0;
  const reviewCount   = vendor.review_count ?? 0;
  const verLevel      = Math.min(vendor.verification_level ?? (vendor.verified ? 1 : 0), 4);
  const jobs          = vendor.completed_jobs_count ?? 0;
  const responseRate  = vendor.response_rate ?? 0;
  const cancelRate    = vendor.cancellation_rate ?? 0;

  const ratingPts     = (rating / 5) * 25;
  const reviewPts     = reviewCount > 0
    ? Math.min(Math.log2(reviewCount + 1) / Math.log2(101), 1) * 8
    : 0;
  const verPts        = VERIFICATION_PTS[verLevel] ?? 0;
  const activityPts   = Math.min(jobs * 0.3, 15);
  const responsePts   = (responseRate / 100) * 12;

  const profilePts    =
    ((vendor.bio ?? "").trim().length >= 50 ? 2 : 0) +
    (vendor.phone                           ? 2 : 0) +
    (vendor.city                            ? 2 : 0) +
    ((vendor.instagram_url || vendor.website_url) ? 2 : 0) +
    ((vendor.packages && vendor.packages.length > 0) ? 2 : 0);

  const reputationPts = Math.min(((vendor.reputation_score ?? 0) / 100) * 5, 5);
  const penalty = Math.min((cancelRate / 100) * 10, 10);

  const raw   = Math.max(0, ratingPts + reviewPts + verPts + activityPts + responsePts + profilePts + reputationPts - penalty);
  const total = Math.min(Math.round((raw / RAW_MAX) * 100), 100);

  const tier: VisibilityTier =
    total >= 90 ? "priority" :
    total >= 70 ? "standard" :
    total >= 50 ? "reduced"  :
                  "limited";

  const { label: tierLabel, badgeClass: tierBadgeClass } = TIER_CONFIG[tier];

  return {
    raw: Math.round(raw * 10) / 10,
    total,
    tier,
    tierLabel,
    tierBadgeClass,
    factors: {
      rating:        Math.round(ratingPts      * 10) / 10,
      reviews:       Math.round(reviewPts      * 10) / 10,
      verification:  verPts,
      activity:      Math.round(activityPts    * 10) / 10,
      responsiveness:Math.round(responsePts    * 10) / 10,
      profile:       profilePts,
      reputation:    Math.round(reputationPts  * 10) / 10,
      penalty:      -Math.round(penalty        * 10) / 10,
    },
  };
}

// Returns vendors sorted by quality score with subscription and featured boosts.
// Boosts are governance-gated: suspended/flagged vendors receive no boost.
// Quality score (total) is NEVER modified — boosts only affect sort order.
// Does NOT mutate the input array.
export function calculateMarketplaceRank<T extends VendorRankInput>(
  vendors: T[]
): (T & { _rankScore: VendorRankScore })[] {
  return vendors
    .map((v) => ({ ...v, _rankScore: calculateVendorScore(v) }))
    .sort((a, b) => {
      const governance = {
        vendorStatus:        a.status ?? "approved",
        suspiciousFlag:      a.suspicious_flag ?? false,
        hasCriticalWarnings: false,
      };
      const governanceB = {
        vendorStatus:        b.status ?? "approved",
        suspiciousFlag:      b.suspicious_flag ?? false,
        hasCriticalWarnings: false,
      };
      const boostA = getPlanVisibilityBoost(a.subscription_plan ?? null, governance) + (a.featured && a.status !== "suspended" ? 10 : 0);
      const boostB = getPlanVisibilityBoost(b.subscription_plan ?? null, governanceB) + (b.featured && b.status !== "suspended" ? 10 : 0);
      const scoreA = a._rankScore.total + boostA;
      const scoreB = b._rankScore.total + boostB;
      return scoreB - scoreA;
    });
}

// Returns the sort value used for the "fastest_responder" sort mode.
// Vendors with no response data sort last.
export function responderSortKey(vendor: VendorRankInput): number {
  return vendor.response_rate ?? -1;
}
