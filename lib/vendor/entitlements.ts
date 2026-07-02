// ── Vendor Entitlements Engine ────────────────────────────────────────────────
//
// Single source of truth for what each subscription plan unlocks.
// All feature-gating checks must go through here — never scatter plan checks
// across components or API routes.
//
// PRINCIPLE: Plans monetize visibility, tooling, and convenience.
//            They NEVER override trust scores or bypass governance.

export type PlanSlug = "free" | "pro" | "featured" | "premium" | "elite";

export interface PlanConfig {
  slug:                       PlanSlug;
  name:                       string;
  monthlyPrice:               number;
  annualPrice:                number;
  visibilityBoost:            number;  // sort-level boost in marketplace ranking (not quality score)
  maxImages:                  number;  // -1 = unlimited
  maxPackages:                number;  // -1 = unlimited
  maxContacts:                number;  // -1 = unlimited; active (non-archived) manual_contacts
  analyticsTier:              "basic" | "standard" | "advanced";
  featuredEligible:           boolean; // eligible for homepage featured slot
  categoryFeaturedEligible:   boolean; // eligible for top of category pages
  prioritySupport:            boolean;
}

// Source of truth — mirrors subscription_plans DB table.
// DB is authoritative; this is used in pure logic contexts (no DB available).
export const PLAN_CONFIG: Record<PlanSlug, PlanConfig> = {
  free: {
    slug: "free", name: "Free",
    monthlyPrice: 0, annualPrice: 0,
    visibilityBoost: 0, maxImages: 5, maxPackages: 1, maxContacts: 25,
    analyticsTier: "basic",
    featuredEligible: false, categoryFeaturedEligible: false, prioritySupport: false,
  },
  pro: {
    slug: "pro", name: "Pro",
    monthlyPrice: 29, annualPrice: 279,
    visibilityBoost: 3, maxImages: 20, maxPackages: -1, maxContacts: -1,
    analyticsTier: "standard",
    featuredEligible: false, categoryFeaturedEligible: false, prioritySupport: false,
  },
  // 'featured' is the legacy slug for premium behaviour — treated identically to 'premium'
  featured: {
    slug: "featured", name: "Premium",
    monthlyPrice: 79, annualPrice: 759,
    visibilityBoost: 6, maxImages: 50, maxPackages: -1, maxContacts: -1,
    analyticsTier: "advanced",
    featuredEligible: true, categoryFeaturedEligible: true, prioritySupport: false,
  },
  premium: {
    slug: "premium", name: "Premium",
    monthlyPrice: 79, annualPrice: 759,
    visibilityBoost: 6, maxImages: 50, maxPackages: -1, maxContacts: -1,
    analyticsTier: "advanced",
    featuredEligible: true, categoryFeaturedEligible: true, prioritySupport: false,
  },
  elite: {
    slug: "elite", name: "Elite",
    monthlyPrice: 149, annualPrice: 1428,
    visibilityBoost: 10, maxImages: -1, maxPackages: -1, maxContacts: -1,
    analyticsTier: "advanced",
    featuredEligible: true, categoryFeaturedEligible: true, prioritySupport: true,
  },
};

// ── Governance context required to gate visibility boosts ─────────────────────

export interface GovernanceContext {
  vendorStatus:         string;           // 'approved' | 'suspended' | 'pending' | 'rejected'
  suspiciousFlag:       boolean;
  hasCriticalWarnings:  boolean;
}

// ── Entitlement result ─────────────────────────────────────────────────────────

export interface VendorEntitlements {
  plan:                       PlanSlug;
  maxImages:                  number;   // -1 = unlimited
  maxPackages:                number;   // -1 = unlimited
  maxContacts:                number;   // -1 = unlimited
  canAccessAdvancedAnalytics: boolean;
  canAccessStandardAnalytics: boolean;
  canAppearAsFeatured:        boolean;  // homepage featured slot
  canAppearInCategoryFeatured:boolean;  // top of category page
  canCustomizeProfile:        boolean;
  canAccessPrioritySupport:   boolean;
  visibilityBoost:            number;   // governance-gated sort boost (0 if suspended)
  isPaid:                     boolean;
}

export function getEntitlements(
  plan: PlanSlug | string | null | undefined,
  governance?: GovernanceContext
): VendorEntitlements {
  const slug = normalizePlan(plan);
  const config = PLAN_CONFIG[slug];

  // Governance gating on visibility boost
  const isSuspended = governance?.vendorStatus === "suspended";
  const isFlagged   = governance?.suspiciousFlag ?? false;
  const hasCritical = governance?.hasCriticalWarnings ?? false;

  let visibilityBoost = config.visibilityBoost;
  if (isSuspended || isFlagged) {
    visibilityBoost = 0;
  } else if (hasCritical) {
    visibilityBoost = Math.floor(visibilityBoost / 2);
  }

  // Featured is further blocked for suspended/flagged/at_risk vendors
  const governanceBlocksFeatured = isSuspended || isFlagged || hasCritical;
  const canAppearAsFeatured = config.featuredEligible && !governanceBlocksFeatured;
  const canAppearInCategoryFeatured = config.categoryFeaturedEligible && !governanceBlocksFeatured;

  return {
    plan:                        slug,
    maxImages:                   config.maxImages,
    maxPackages:                 config.maxPackages,
    maxContacts:                 config.maxContacts,
    canAccessAdvancedAnalytics:  config.analyticsTier === "advanced",
    canAccessStandardAnalytics:  config.analyticsTier !== "basic",
    canAppearAsFeatured,
    canAppearInCategoryFeatured,
    canCustomizeProfile:         slug !== "free",
    canAccessPrioritySupport:    config.prioritySupport,
    visibilityBoost,
    isPaid:                      config.monthlyPrice > 0,
  };
}

// ── Individual gate functions (convenience wrappers) ─────────────────────────

export function canAccessAdvancedAnalytics(plan: PlanSlug | string | null): boolean {
  return PLAN_CONFIG[normalizePlan(plan)]?.analyticsTier === "advanced";
}

export function canUploadMoreImages(plan: PlanSlug | string | null, currentCount: number): boolean {
  const limit = PLAN_CONFIG[normalizePlan(plan)]?.maxImages ?? 5;
  return limit === -1 || currentCount < limit;
}

export function canAppearAsFeatured(plan: PlanSlug | string | null, governance?: GovernanceContext): boolean {
  return getEntitlements(plan, governance).canAppearAsFeatured;
}

export function canCustomizeProfile(plan: PlanSlug | string | null): boolean {
  return normalizePlan(plan) !== "free";
}

export function canAccessPrioritySupport(plan: PlanSlug | string | null): boolean {
  return PLAN_CONFIG[normalizePlan(plan)]?.prioritySupport ?? false;
}

export function getPlanVisibilityBoost(
  plan: PlanSlug | string | null,
  governance?: GovernanceContext
): number {
  return getEntitlements(plan, governance).visibilityBoost;
}

export function getMaxImages(plan: PlanSlug | string | null): number {
  return PLAN_CONFIG[normalizePlan(plan)]?.maxImages ?? 5;
}

export function getMaxPackages(plan: PlanSlug | string | null): number {
  return PLAN_CONFIG[normalizePlan(plan)]?.maxPackages ?? 1;
}

export function getMaxContacts(plan: PlanSlug | string | null): number {
  return PLAN_CONFIG[normalizePlan(plan)]?.maxContacts ?? 25;
}

export function canAddMoreContacts(plan: PlanSlug | string | null, currentCount: number): boolean {
  const limit = getMaxContacts(plan);
  return limit === -1 || currentCount < limit;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function normalizePlan(plan: string | null | undefined): PlanSlug {
  if (!plan || !PLAN_CONFIG[plan as PlanSlug]) return "free";
  return plan as PlanSlug;
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return (PLAN_CONFIG[normalizePlan(plan)]?.monthlyPrice ?? 0) > 0;
}

export function planDisplayName(plan: string | null | undefined): string {
  return PLAN_CONFIG[normalizePlan(plan)]?.name ?? "Free";
}

// ── Monthly recurring revenue helpers ────────────────────────────────────────

export function planMRRContribution(plan: PlanSlug | string | null): number {
  return PLAN_CONFIG[normalizePlan(plan)]?.monthlyPrice ?? 0;
}
