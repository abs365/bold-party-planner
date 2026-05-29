// ── Vendor Lifecycle Governance Engine ───────────────────────────────────────
//
// Single source of truth for all vendor capability checks and lifecycle rules.
// Every visibility/permission check in the app should flow through here.
// Pure functions — no DB calls. Operates on normalized inputs.
//
// Lifecycle states:
//   no_account       — no vendor profile
//   pending          — application submitted, awaiting admin review
//   setup            — approved but profile < 40% complete (hidden from marketplace)
//   at_risk          — approved but health or compliance declining
//   marketplace_ready — approved, complete, healthy, fully visible
//   optimised        — top-tier: priority placement, all features unlocked
//   suspended        — admin-suspended, hidden from marketplace
//   rejected         — application rejected
//
// Capabilities (resolved here, never scattered across components):
//   canAppearInMarketplace    — shows in browse/search results
//   canReceiveQuotes          — customers can send quote requests
//   canReceiveBookings        — customers can confirm bookings
//   canBeFeatured             — eligible for promoted placement
//   canReceivePriorityPlacement — top of recommended sort
//   canUploadMedia            — upload portfolio photos/videos
//   canSubmitVerification     — submit identity/business documents
//   canAccessPremiumFeatures  — use pro/featured subscription features

export type VendorLifecycleState =
  | "no_account"
  | "pending"
  | "setup"
  | "at_risk"
  | "marketplace_ready"
  | "optimised"
  | "suspended"
  | "rejected";

export interface GovernanceCapabilities {
  canAppearInMarketplace: boolean;
  canReceiveQuotes: boolean;
  canReceiveBookings: boolean;
  canBeFeatured: boolean;
  canReceivePriorityPlacement: boolean;
  canUploadMedia: boolean;
  canSubmitVerification: boolean;
  canAccessPremiumFeatures: boolean;
}

export interface GovernanceInput {
  status: string;
  verificationLevel: number;
  completionScore: number;
  rankScore: number;
  healthScore: number;
  hasCriticalWarnings: boolean;
  isSuspicious: boolean;
  cancellationRate: number | null;
  responseRate: number | null;
  subscriptionPlan?: string | null;
}

export interface GovernanceResult {
  lifecycleState: VendorLifecycleState;
  capabilities: GovernanceCapabilities;
  visibilityReason: string;
  rankingMultiplier: number; // 1.0 = normal, <1.0 = reduced, 0.0 = hidden
}

export interface LifecycleStateMeta {
  label: string;
  description: string;
  badgeClass: string;
  adminActions: string[];
}

// ── Lifecycle state resolution ────────────────────────────────────────────────

export function resolveLifecycleState(input: GovernanceInput): VendorLifecycleState {
  const { status, completionScore, healthScore, hasCriticalWarnings, isSuspicious } = input;

  if (!status || status === "no_account") return "no_account";
  if (status === "pending")   return "pending";
  if (status === "rejected")  return "rejected";
  if (status === "suspended") return "suspended";

  // Approved — determine quality tier
  if (isSuspicious || hasCriticalWarnings) return "at_risk";
  if (completionScore < 40 || healthScore < 30) return "setup";
  if (healthScore < 50 || completionScore < 60) return "at_risk";
  if (completionScore >= 85 && healthScore >= 70 && input.rankScore >= 70) return "optimised";
  return "marketplace_ready";
}

// ── Capability resolution ─────────────────────────────────────────────────────

export function resolveCapabilities(input: GovernanceInput): GovernanceCapabilities {
  const state   = resolveLifecycleState(input);
  const { verificationLevel, completionScore, rankScore, healthScore, subscriptionPlan } = input;
  const isApproved = input.status === "approved";
  const isPaid     = subscriptionPlan === "pro" || subscriptionPlan === "featured";

  return {
    canAppearInMarketplace:
      isApproved &&
      completionScore >= 40 &&
      !input.isSuspicious &&
      state !== "suspended" &&
      state !== "rejected",

    canReceiveQuotes:
      isApproved &&
      completionScore >= 60 &&
      healthScore >= 40 &&
      !input.isSuspicious,

    canReceiveBookings:
      isApproved &&
      completionScore >= 60 &&
      healthScore >= 40 &&
      !input.hasCriticalWarnings &&
      !input.isSuspicious,

    canBeFeatured:
      isApproved &&
      completionScore >= 80 &&
      rankScore >= 60 &&
      healthScore >= 65 &&
      !input.isSuspicious &&
      !input.hasCriticalWarnings &&
      isPaid,

    canReceivePriorityPlacement:
      isApproved &&
      completionScore >= 70 &&
      rankScore >= 65 &&
      healthScore >= 55 &&
      !input.isSuspicious,

    canUploadMedia:
      isApproved || input.status === "pending",

    canSubmitVerification:
      (isApproved || input.status === "pending") &&
      verificationLevel < 4 &&
      !input.isSuspicious,

    canAccessPremiumFeatures:
      isApproved && isPaid,
  };
}

// ── Full governance resolution ────────────────────────────────────────────────

export function resolveGovernance(input: GovernanceInput): GovernanceResult {
  const lifecycleState = resolveLifecycleState(input);
  const capabilities   = resolveCapabilities(input);

  const rankingMultiplier: number =
    lifecycleState === "optimised"         ? 1.0 :
    lifecycleState === "marketplace_ready" ? 1.0 :
    lifecycleState === "at_risk"           ? 0.6 :
    lifecycleState === "setup"             ? 0.4 :
                                             0.0;

  let visibilityReason: string;
  if (!capabilities.canAppearInMarketplace) {
    if (input.status === "suspended")      visibilityReason = "Account suspended";
    else if (input.status === "rejected")  visibilityReason = "Application rejected";
    else if (input.isSuspicious)           visibilityReason = "Account under review";
    else                                   visibilityReason = "Profile incomplete — reach 40% to appear in marketplace";
  } else if (lifecycleState === "at_risk") {
    visibilityReason = "Reduced visibility due to performance concerns";
  } else if (lifecycleState === "optimised") {
    visibilityReason = "Priority placement — top-tier vendor";
  } else {
    visibilityReason = "Visible in marketplace";
  }

  return { lifecycleState, capabilities, visibilityReason, rankingMultiplier };
}

// ── State metadata ────────────────────────────────────────────────────────────

export const LIFECYCLE_STATE_META: Record<VendorLifecycleState, LifecycleStateMeta> = {
  no_account: {
    label: "No Account",
    description: "No vendor profile created",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    adminActions: [],
  },
  setup: {
    label: "Setup",
    description: "Approved but profile below marketplace threshold",
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    adminActions: ["message", "suspend"],
  },
  pending: {
    label: "Pending",
    description: "Awaiting admin review",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    adminActions: ["approve", "reject"],
  },
  at_risk: {
    label: "At Risk",
    description: "Approved but health or compliance declining",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    adminActions: ["warn", "suspend", "message", "review"],
  },
  marketplace_ready: {
    label: "Active",
    description: "Visible in marketplace",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    adminActions: ["feature", "verify", "suspend", "message"],
  },
  optimised: {
    label: "Optimised",
    description: "Top-tier vendor with priority placement",
    badgeClass: "bg-brand-500/15 text-brand-300 border-brand-500/25",
    adminActions: ["feature", "verify", "suspend", "message"],
  },
  suspended: {
    label: "Suspended",
    description: "Account suspended by admin",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/25",
    adminActions: ["reactivate", "message"],
  },
  rejected: {
    label: "Rejected",
    description: "Application rejected",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/25",
    adminActions: ["reactivate"],
  },
};
