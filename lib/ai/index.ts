// AI Automation Layer — Phase 1 (Rule-Based)
// Replace individual functions with ML models as data grows

// Shared types
export type { VendorMatchScore, VendorMatchParams } from "./vendor-match";
export type { RoutingDecision } from "./lead-routing";
export type { ModerationResult } from "./auto-moderation";
export type { ScoringWeights } from "./scoring";

// Re-exports
export { matchVendorsForEvent } from "./vendor-match";
export { routeLeadToVendors } from "./lead-routing";
export { scoreVendor, scoreLead, SCORING_WEIGHTS } from "./scoring";
export { moderateContent, BLOCKED_KEYWORDS } from "./auto-moderation";

// Additional shared types not tied to a single module
export interface LeadScore {
  quoteId: string;
  score: number;
  signals: {
    budgetScore: number;
    guestScore: number;
    futureDateScore: number;
  };
}
