// ── Vendor Health Score ────────────────────────────────────────────────────────
//
// Measures OPERATIONAL health — separate from the onboarding/completion score.
//   Onboarding score: "how complete is the profile"
//   Health score:     "how well is the vendor performing right now"
//
// Scoring model (raw max = 90, normalized to 0–100):
//   Rating quality        0–20   avg_rating / 5 × 20
//   Response rate         0–20   response_rate / 100 × 20
//   Activity recency      0–15   full if < 7 days, decays to 0 at 90 days
//   Booking completion    0–15   log₂ scale, capped at 30 jobs
//   Reliability           0–10   no suspicious_flag = full points
//   Review consistency    0–10   stable good reviews over time
//   Cancellation penalty  0–20   deducted: cancel_rate / 100 × 20
//
// Health tiers:
//   80–100  Excellent
//   60–79   Good
//   40–59   Fair
//   20–39   Poor
//    0–19   Critical

export type HealthTier = "excellent" | "good" | "fair" | "poor" | "critical";

export type RiskFlag =
  | "high_cancellation_rate"
  | "low_response_rate"
  | "inactivity"
  | "suspicious_flag"
  | "poor_reviews"
  | "no_activity";

export interface HealthFactors {
  ratingQuality: number;
  responseRate: number;
  activityRecency: number;
  bookingCompletion: number;
  reliability: number;
  reviewConsistency: number;
  cancellationPenalty: number;
}

export interface VendorHealthScore {
  raw: number;
  total: number;
  tier: HealthTier;
  tierLabel: string;
  tierBadgeClass: string;
  factors: HealthFactors;
  riskFlags: RiskFlag[];
  isAtRisk: boolean;
}

export interface HealthInput {
  rating: number | null;
  review_count: number | null;
  response_rate: number | null;
  cancellation_rate: number | null;
  completed_jobs_count: number | null;
  suspicious_flag: boolean;
  last_active_at?: string | null;
  created_at?: string;
}

const RAW_MAX = 90;

const TIER_CONFIG: Record<HealthTier, { label: string; badgeClass: string }> = {
  excellent: { label: "Excellent", badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  good:      { label: "Good",      badgeClass: "bg-green-500/15 text-green-400 border-green-500/25" },
  fair:      { label: "Fair",      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  poor:      { label: "Poor",      badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  critical:  { label: "Critical",  badgeClass: "bg-red-500/15 text-red-400 border-red-500/25" },
};

function activityDecay(lastActiveAt: string | null | undefined, createdAt: string | undefined): number {
  const now = Date.now();
  // New vendors (< 7 days old) get full activity credit — haven't had time to be active yet
  if (createdAt) {
    const ageDays = (now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) return 15;
  }
  if (!lastActiveAt) return 0;
  const daysSince = (now - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7)  return 15;
  if (daysSince <= 14) return 12;
  if (daysSince <= 30) return 8;
  if (daysSince <= 60) return 4;
  return 0;
}

export function calculateVendorHealthScore(vendor: HealthInput): VendorHealthScore {
  const rating       = vendor.rating ?? 0;
  const reviews      = vendor.review_count ?? 0;
  const responseRate = vendor.response_rate ?? 0;
  const cancelRate   = vendor.cancellation_rate ?? 0;
  const jobs         = vendor.completed_jobs_count ?? 0;

  const ratingQuality  = (rating / 5) * 20;
  const responsePts    = (responseRate / 100) * 20;
  const activityPts    = activityDecay(vendor.last_active_at, vendor.created_at);
  const completionPts  = jobs > 0 ? Math.min(Math.log2(jobs + 1) / Math.log2(31), 1) * 15 : 0;
  const reliabilityPts = vendor.suspicious_flag ? 0 : 10;
  const consistencyPts =
    reviews >= 3 && rating >= 4.0 ? Math.min(reviews / 20, 1) * 10 :
    reviews >= 3                   ? (rating / 5) * 6 :
                                     0;
  const cancelPenalty  = Math.min((cancelRate / 100) * 20, 20);

  const raw   = Math.max(0, ratingQuality + responsePts + activityPts + completionPts + reliabilityPts + consistencyPts - cancelPenalty);
  const total = Math.min(Math.round((raw / RAW_MAX) * 100), 100);

  const tier: HealthTier =
    total >= 80 ? "excellent" :
    total >= 60 ? "good"      :
    total >= 40 ? "fair"      :
    total >= 20 ? "poor"      :
                  "critical";

  const riskFlags: RiskFlag[] = [];
  if (cancelRate > 20)                           riskFlags.push("high_cancellation_rate");
  if (responseRate > 0 && responseRate < 50)     riskFlags.push("low_response_rate");
  if (activityPts === 0)                         riskFlags.push("inactivity");
  if (vendor.suspicious_flag)                    riskFlags.push("suspicious_flag");
  if (reviews >= 5 && rating < 3.5)             riskFlags.push("poor_reviews");
  if (reviews === 0 && jobs === 0 && activityPts === 0) riskFlags.push("no_activity");

  const { label: tierLabel, badgeClass: tierBadgeClass } = TIER_CONFIG[tier];

  return {
    raw:   Math.round(raw * 10) / 10,
    total,
    tier,
    tierLabel,
    tierBadgeClass,
    factors: {
      ratingQuality:       Math.round(ratingQuality  * 10) / 10,
      responseRate:        Math.round(responsePts    * 10) / 10,
      activityRecency:     activityPts,
      bookingCompletion:   Math.round(completionPts  * 10) / 10,
      reliability:         reliabilityPts,
      reviewConsistency:   Math.round(consistencyPts * 10) / 10,
      cancellationPenalty: -Math.round(cancelPenalty * 10) / 10,
    },
    riskFlags,
    isAtRisk:
      total < 50 ||
      riskFlags.includes("high_cancellation_rate") ||
      riskFlags.includes("suspicious_flag") ||
      riskFlags.includes("poor_reviews"),
  };
}

// ── SLA metrics helper ────────────────────────────────────────────────────────
// Derives structured SLA metrics from the same vendor fields used for health.

export interface VendorSLAMetrics {
  responseRatePercent: number | null;
  cancellationRatePercent: number | null;
  completedJobs: number;
  estimatedResponseTier: "fast" | "moderate" | "slow" | "unknown";
  cancellationRisk: "low" | "moderate" | "high" | "critical";
}

export function computeVendorSLA(vendor: Pick<HealthInput, "response_rate" | "cancellation_rate" | "completed_jobs_count">): VendorSLAMetrics {
  const rr = vendor.response_rate;
  const cr = vendor.cancellation_rate ?? 0;

  return {
    responseRatePercent:     rr,
    cancellationRatePercent: vendor.cancellation_rate,
    completedJobs:           vendor.completed_jobs_count ?? 0,
    estimatedResponseTier:
      rr === null             ? "unknown"  :
      rr >= 80                ? "fast"     :
      rr >= 60                ? "moderate" :
                                "slow",
    cancellationRisk:
      cr > 30 ? "critical" :
      cr > 20 ? "high"     :
      cr > 10 ? "moderate" :
                "low",
  };
}

// ── At-risk summary (WP-D1, Programme D) ────────────────────────────────────
//
// Governance's own page (app/admin/governance/page.tsx) computes this same
// at-risk filter inline, per-vendor, alongside a full warnings/health-factor
// breakdown it needs for its detailed view. This function extracts just the
// count Founder Dashboard needs (a single summary tile) from the same
// underlying logic (calculateVendorHealthScore + suspicious_flag), so Founder
// Dashboard reuses the real computation rather than re-deriving a second,
// looser definition of "at risk". Governance's own page is untouched — this
// is a new, additional caller of the same scoring function, not a refactor
// of the existing one.
export interface AtRiskVendorSummary {
  atRiskCount: number;
  criticalCount: number;
  totalApproved: number;
}

export async function computeAtRiskVendorSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts either the typed admin client or a plain SupabaseClient; matches the existing pattern in lib/vendor/commercial-metrics.ts
  db: any
): Promise<AtRiskVendorSummary> {
  const { data: vendors } = await db
    .from("vendors")
    .select("rating, review_count, response_rate, cancellation_rate, completed_jobs_count, suspicious_flag, last_active_at, created_at")
    .eq("status", "approved")
    .limit(500);

  const rows = (vendors ?? []) as HealthInput[];
  let atRiskCount = 0;
  let criticalCount = 0;

  for (const v of rows) {
    const health = calculateVendorHealthScore(v);
    if (health.isAtRisk || v.suspicious_flag) atRiskCount++;
    if (health.tier === "critical") criticalCount++;
  }

  return { atRiskCount, criticalCount, totalApproved: rows.length };
}
