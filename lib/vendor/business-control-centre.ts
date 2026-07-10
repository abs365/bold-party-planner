// ── Vendor Business Control Centre ───────────────────────────────────────────
//
// Pure computation for the six-section vendor dashboard (ESP 1.3 / 1.3A / 1.3B,
// Wave 1 — trend deferred, see BUSINESS_CONTROL_CENTRE_FINAL_ARCHITECTURE.md §2.6).
// No DB calls. All inputs are already fetched/computed by app/vendor/dashboard/page.tsx.

import { calculateVendorReputation, calculateCustomerSatisfaction } from "@/lib/vendor/reputation";
import { combinedRankingMultiplier, type ComputedWarning } from "@/lib/vendor/warnings";
import type { CompletionResult } from "@/lib/vendor/completion";
import type { VisibilityTier } from "@/lib/vendor/ranking";

// ── Shared input shapes ───────────────────────────────────────────────────────

export interface ControlCentreQuote {
  id: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  budget_max: number | null;
  customer: { full_name: string } | null;
  event: { title: string; date: string; city: string | null } | null;
}

export interface ControlCentreBooking {
  id: string;
  status: string;
  payment_status: string | null;
  vendor_payout: number | null;
  total_amount: number | null;
  event: { title: string; date: string; city: string | null; guest_count: number | null } | null;
  customer: { full_name: string } | null;
}

export interface ControlCentreInput {
  vendor: {
    id: string;
    subscription_plan: string | null;
    response_rate: number | null;
    rating: number;
    review_count: number;
    verified_review_count: number;
    verification_level: number;
    cancellation_rate: number | null;
    completed_jobs_count: number;
    repeat_customer_count: number;
    suspicious_flag: boolean;
    featured: boolean;
    avg_communication: number | null;
    avg_professionalism: number | null;
    avg_punctuality: number | null;
    avg_quality: number | null;
    avg_value: number | null;
  };
  allBookings: ControlCentreBooking[];
  quotes: ControlCentreQuote[];
  unreadMessageCount: number;
  hasAvailability: boolean;
  contactCount: number;
  analyticsEvents: {
    profileViews: number;
    quoteRequests: number;
    mediaViews: number;
    contactClicks: number;
    packageViews: number;
  };
  completion: CompletionResult;
  rankScore: { total: number; tier: VisibilityTier };
  governance: { lifecycleState: string; visibilityReason: string };
  warnings: ComputedWarning[];
}

// ── Business Health ───────────────────────────────────────────────────────────

export interface BusinessHealthCategory {
  score: number | null; // null = insufficient data (Customer Experience only)
  label: string;
  tierLabel: string;
  insufficientDataReason?: string;
}

export type BusinessHealthTier = "excellent" | "strong" | "good" | "fair" | "building";

export interface BusinessHealthScore {
  overall: number;
  tier: BusinessHealthTier;
  tierLabel: string;
  tierColour: string;
  categories: {
    trust: BusinessHealthCategory;
    growth: BusinessHealthCategory;
    operations: BusinessHealthCategory;
    customerExperience: BusinessHealthCategory;
  };
  weakestCategoryKey: "trust" | "growth" | "operations" | "customerExperience";
  actionText: string;
  actionHref: string;
}

function tierFromScore(score: number): { tier: BusinessHealthTier; tierLabel: string; tierColour: string } {
  if (score >= 85) return { tier: "excellent", tierLabel: "Excellent", tierColour: "text-emerald-400" };
  if (score >= 70) return { tier: "strong", tierLabel: "Strong", tierColour: "text-green-400" };
  if (score >= 55) return { tier: "good", tierLabel: "Good", tierColour: "text-blue-400" };
  if (score >= 40) return { tier: "fair", tierLabel: "Fair", tierColour: "text-amber-400" };
  return { tier: "building", tierLabel: "Building", tierColour: "text-slate-400" };
}

// Operations category (0-100) — the one composite with no pre-existing engine.
// Built entirely from data already fetched/computed elsewhere on the dashboard.
function scoreOperations(input: {
  hasAvailability: boolean;
  warnings: ComputedWarning[];
  confirmedCount: number;
  pendingCount: number;
}): number {
  const availabilityPts = input.hasAvailability ? 30 : 0;
  const warningFreePts = combinedRankingMultiplier(input.warnings) * 40;
  const momentum = input.confirmedCount + input.pendingCount;
  const momentumPts = momentum >= 3 ? 30 : momentum >= 1 ? 18 : 0;
  return Math.round(availabilityPts + warningFreePts + momentumPts);
}

export function computeBusinessHealthScore(input: ControlCentreInput): BusinessHealthScore {
  const { vendor } = input;
  const confirmed = input.allBookings.filter((b) => b.status === "confirmed" || b.status === "accepted");
  const pending = input.allBookings.filter((b) => b.status === "pending");

  const trustScore = calculateVendorReputation({
    rating: vendor.rating,
    review_count: vendor.review_count,
    verified_review_count: vendor.verified_review_count,
    response_rate: vendor.response_rate,
    cancellation_rate: vendor.cancellation_rate,
    completed_jobs_count: vendor.completed_jobs_count,
    repeat_customer_count: vendor.repeat_customer_count,
    avg_communication: vendor.avg_communication,
    avg_professionalism: vendor.avg_professionalism,
    avg_punctuality: vendor.avg_punctuality,
    avg_quality: vendor.avg_quality,
    avg_value: vendor.avg_value,
  }).score;

  const growthScore = input.rankScore.total;

  const operationsScore = scoreOperations({
    hasAvailability: input.hasAvailability,
    warnings: input.warnings,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
  });

  const hasEnoughReviewsForCX = vendor.review_count >= 3;
  const cxScore = hasEnoughReviewsForCX
    ? calculateCustomerSatisfaction({
        avg_communication: vendor.avg_communication,
        avg_professionalism: vendor.avg_professionalism,
        avg_punctuality: vendor.avg_punctuality,
        avg_quality: vendor.avg_quality,
        avg_value: vendor.avg_value,
        review_count: vendor.review_count,
      })
    : null;

  const overall = hasEnoughReviewsForCX
    ? Math.round(trustScore * 0.30 + growthScore * 0.25 + operationsScore * 0.25 + (cxScore ?? 0) * 0.20)
    : Math.round(trustScore * 0.40 + growthScore * 0.33 + operationsScore * 0.27);

  const categories: BusinessHealthScore["categories"] = {
    trust: { score: trustScore, label: "Trust", tierLabel: tierFromScore(trustScore).tierLabel },
    growth: { score: growthScore, label: "Growth", tierLabel: tierFromScore(growthScore).tierLabel },
    operations: { score: operationsScore, label: "Operations", tierLabel: tierFromScore(operationsScore).tierLabel },
    customerExperience: hasEnoughReviewsForCX
      ? { score: cxScore, label: "Customer Experience", tierLabel: tierFromScore(cxScore ?? 0).tierLabel }
      : {
          score: null,
          label: "Customer Experience",
          tierLabel: "—",
          insufficientDataReason: `Not enough data yet (${vendor.review_count} review${vendor.review_count === 1 ? "" : "s"}, need 3)`,
        },
  };

  const scored = [
    { key: "trust" as const, score: trustScore, href: "/vendor/reviews", text: "Improve your Trust score by earning more reviews" },
    { key: "growth" as const, score: growthScore, href: "/vendor/profile", text: "Improve your Growth score by completing your profile" },
    { key: "operations" as const, score: operationsScore, href: "/vendor/availability", text: "Improve your Operations score by setting your calendar" },
  ];
  const weakest = scored.reduce((min, c) => (c.score < min.score ? c : min), scored[0]);

  const { tier, tierLabel, tierColour } = tierFromScore(overall);

  return {
    overall,
    tier,
    tierLabel,
    tierColour,
    categories,
    weakestCategoryKey: weakest.key,
    actionText: weakest.text,
    actionHref: weakest.href,
  };
}

// ── Priority Cascade (Today's Priorities) ─────────────────────────────────────

export type PriorityLevel = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7";
export type PriorityColour = "gold" | "amber" | "red" | "blue" | "slate" | "emerald";

export interface Priority {
  level: PriorityLevel;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  borderColour: PriorityColour;
}

function computePriority(input: ControlCentreInput, ctx: {
  shortlisted: ControlCentreQuote[];
  pendingBookings: ControlCentreBooking[];
  pendingQuotes: ControlCentreQuote[];
  upcoming: ControlCentreBooking[];
  pendingPayoutTotal: number;
}): Priority {
  const { shortlisted, pendingBookings, pendingQuotes, upcoming, pendingPayoutTotal } = ctx;

  if (shortlisted.length > 0) {
    const q = shortlisted[0];
    return {
      level: "P1",
      message: `You're a finalist. ${q.customer?.full_name ?? "A customer"} has shortlisted your quote for ${q.event?.title ?? "their event"}.`,
      ctaLabel: "View Lead",
      ctaHref: "/vendor/quotes",
      borderColour: "gold",
    };
  }

  if (pendingBookings.length > 0) {
    return {
      level: "P2",
      message: `${pendingBookings.length} booking request${pendingBookings.length === 1 ? "" : "s"} need your response.`,
      ctaLabel: "Review Bookings",
      ctaHref: "/vendor/bookings",
      borderColour: "amber",
    };
  }

  const expiringSoon = pendingQuotes.filter((q) => {
    if (!q.expires_at) return false;
    const hoursLeft = (new Date(q.expires_at).getTime() - Date.now()) / 3_600_000;
    return hoursLeft > 0 && hoursLeft <= 24;
  });
  if (expiringSoon.length > 0) {
    return {
      level: "P3",
      message: `${expiringSoon.length} lead${expiringSoon.length === 1 ? "" : "s"} expire${expiringSoon.length === 1 ? "s" : ""} today. Respond now.`,
      ctaLabel: "View Leads",
      ctaHref: "/vendor/quotes",
      borderColour: "red",
    };
  }

  if (upcoming.length > 0 && upcoming[0].event?.date) {
    const daysUntil = Math.ceil((new Date(upcoming[0].event.date).getTime() - Date.now()) / 86_400_000);
    if (daysUntil <= 3) {
      return {
        level: "P4",
        message: `Your next event is in ${daysUntil} day${daysUntil === 1 ? "" : "s"}: ${upcoming[0].event.title}.`,
        ctaLabel: "View Booking",
        ctaHref: "/vendor/bookings",
        borderColour: "blue",
      };
    }
  }

  if (input.unreadMessageCount > 0) {
    return {
      level: "P5",
      message: `${input.unreadMessageCount} customer message${input.unreadMessageCount === 1 ? "" : "s"} waiting for your reply.`,
      ctaLabel: "Open Messages",
      ctaHref: "/vendor/messages",
      borderColour: "slate",
    };
  }

  if (input.completion.score < 60) {
    return {
      level: "P6",
      message: input.completion.nextActionText
        ? input.completion.nextActionText
        : `Your profile is ${input.completion.score}% complete. Finish your profile to attract more bookings.`,
      ctaLabel: input.completion.nextStep?.cta ?? "Complete Profile",
      ctaHref: input.completion.nextActionHref ?? input.completion.nextStep?.href ?? "/vendor/profile",
      borderColour: "slate",
    };
  }

  // P7 — nothing urgent, show the best growth tip
  const { profileViews, quoteRequests } = input.analyticsEvents;
  if (profileViews > 10 && quoteRequests === 0) {
    return {
      level: "P7",
      message: `You got ${profileViews} profile views but no enquiries. Upload more photos or add a package to convert visitors.`,
      ctaLabel: "Upload Photos",
      ctaHref: "/vendor/media",
      borderColour: "emerald",
    };
  }
  if (pendingPayoutTotal > 0) {
    return {
      level: "P7",
      message: `£${pendingPayoutTotal.toFixed(0)} is pending payout after your upcoming events.`,
      ctaLabel: "View Payouts",
      ctaHref: "/vendor/payouts",
      borderColour: "emerald",
    };
  }
  if (input.vendor.review_count < 5) {
    return {
      level: "P7",
      message: "Ask your last customer to leave a review to build trust.",
      ctaLabel: "View Bookings",
      ctaHref: "/vendor/bookings",
      borderColour: "emerald",
    };
  }
  return {
    level: "P7",
    message: "All caught up. Your profile is live — check your analytics to see how you're performing.",
    ctaLabel: "View Analytics",
    ctaHref: "/vendor/analytics",
    borderColour: "emerald",
  };
}

// ── Revenue (Confirmed / Pipeline / Potential) ────────────────────────────────

export interface RevenueBreakdown {
  confirmed: number;
  pipeline: number;
  potential: number;
  hasData: boolean;
}

function computeRevenue(ctx: {
  allBookings: ControlCentreBooking[];
  pendingBookings: ControlCentreBooking[];
  shortlisted: ControlCentreQuote[];
  potentialQuotes: ControlCentreQuote[];
}): RevenueBreakdown {
  const confirmed = ctx.allBookings
    .filter((b) => b.status === "confirmed" && (b.payment_status === "deposit_paid" || b.payment_status === "fully_paid"))
    .reduce((sum, b) => sum + (b.vendor_payout ?? 0), 0);

  const pipelineFromBookings = ctx.pendingBookings
    .reduce((sum, b) => sum + (b.vendor_payout ?? (b.total_amount ?? 0) * 0.9), 0);
  const pipelineFromShortlisted = ctx.shortlisted
    .filter((q) => q.budget_max != null)
    .reduce((sum, q) => sum + (q.budget_max ?? 0) * 0.9, 0);
  const pipeline = pipelineFromBookings + pipelineFromShortlisted;

  const potential = ctx.potentialQuotes
    .filter((q) => q.budget_max != null)
    .reduce((sum, q) => sum + (q.budget_max ?? 0) * 0.9, 0);

  return {
    confirmed: Math.round(confirmed),
    pipeline: Math.round(pipeline),
    potential: Math.round(potential),
    hasData: confirmed > 0 || pipeline > 0 || potential > 0,
  };
}

// ── Daily Highest-Impact Action (exactly one — ESP 1.3B §1) ──────────────────

export interface DailyHighestImpactAction {
  message: string;
  ctaLabel: string;
  ctaHref: string;
  measurableClaim: string;
}

function computeDailyHighestImpactAction(
  input: ControlCentreInput,
  health: BusinessHealthScore,
  activePriorityMessage: string,
): DailyHighestImpactAction {
  const candidates: DailyHighestImpactAction[] = [];

  // 0. Zero marketplace activity — every other candidate below is either
  // gated on marketplace signals (profile views, bookings) or a generic
  // catch-all; a genuinely zero-activity vendor has no controllable next
  // step from any of them. Point at the CRM instead — fully within the
  // vendor's control regardless of marketplace volume (WP-B5, EDP-02 §7 /
  // EDP-03 Cluster 2).
  if (input.allBookings.length === 0 && input.quotes.length === 0 && input.contactCount < 3) {
    candidates.push({
      message: "No marketplace activity yet — that's normal early on. Add your existing customer contacts to your CRM so nothing from Instagram, WhatsApp or referrals falls through the cracks.",
      ctaLabel: "Add a contact",
      ctaHref: "/vendor/contacts",
      measurableClaim: `${input.contactCount}/3 contacts added`,
    });
  }

  // 1. Subscription upside — free plan only
  if (input.vendor.subscription_plan === "free" || input.vendor.subscription_plan == null) {
    if (input.analyticsEvents.profileViews >= 15 && input.allBookings.filter((b) => b.status === "confirmed").length === 0) {
      candidates.push({
        message: `Your profile attracted ${input.analyticsEvents.profileViews} visitors this month but no bookings. Pro vendors get a +3 search ranking boost, so more of that traffic sees them first.`,
        ctaLabel: "See what Pro gives you",
        ctaHref: "/vendor/subscription?src=daily_action",
        // Phase 72 Priority 4: this was previously an unverified "typically
        // 2-3 extra enquiries/month" claim with no data behind it. +3 is the
        // actual, code-verifiable visibilityBoost difference between free
        // and pro plans (lib/vendor/entitlements.ts) - a real fact, not an
        // asserted conversion outcome. Once vendor.subscription.page_viewed/
        // checkout_started have enough volume, this can be revisited with an
        // actual measured claim.
        measurableClaim: "+3 search ranking boost",
      });
    }
  }

  // 2. Next incomplete onboarding step (already point-ranked by completion.ts)
  if (input.completion.nextStep && input.completion.nextActionText) {
    candidates.push({
      message: input.completion.nextActionText,
      ctaLabel: input.completion.nextStep.cta,
      ctaHref: input.completion.nextStep.href,
      measurableClaim: `+${input.completion.nextStep.maxPoints - input.completion.nextStep.earnedPoints} profile pts`,
    });
  }

  // 3. Weakest Business Health category
  candidates.push({
    message: health.actionText,
    ctaLabel: "Improve Now",
    ctaHref: health.actionHref,
    measurableClaim: `${health.categories[health.weakestCategoryKey].score ?? 0}/100`,
  });

  // 4. Review volume fallback
  if (input.vendor.review_count < 5) {
    candidates.push({
      message: "Ask your last customer to leave a review to build trust with future customers.",
      ctaLabel: "View Bookings",
      ctaHref: "/vendor/bookings",
      measurableClaim: `${input.vendor.review_count}/5 reviews`,
    });
  }

  const filtered = candidates.filter((c) => c.message !== activePriorityMessage);

  return filtered[0] ?? {
    message: "Your profile is fully optimised. Check Marketplace Activity to see how you're performing.",
    ctaLabel: "View Analytics",
    ctaHref: "/vendor/analytics",
    measurableClaim: "",
  };
}

// ── Marketplace Activity / Business Operations ────────────────────────────────

export interface MarketplaceActivity {
  profileViews: number;
  quoteRequests: number;
  mediaViews: number;
  contactClicks: number;
  packageViews: number;
  conversionRate: string;
  rankTier: VisibilityTier;
  visibilityReason: string;
  featured: boolean;
}

export interface BusinessOperations {
  pendingBookings: number;
  confirmedBookings: number;
  awaitingPaymentBookings: number;
  nextEvent: {
    daysUntil: number;
    title: string;
    date: string;
    city: string | null;
    bookingId: string;
    guestCount: number | null;
    totalUpcomingCount: number;
  } | null;
  responseTracker: {
    responseRate: number | null;
    oldestPendingQuoteHoursAgo: number | null;
    tierLabel: string;
  };
  unreadMessageCount: number;
  hasAvailability: boolean;
  earned: number;
  pendingPayout: number;
  activeWarnings: ComputedWarning[];
}

function responseTierLabel(responseRate: number | null): string {
  if (responseRate === null) return "—";
  if (responseRate >= 80) return "Fast responder · Top tier";
  if (responseRate >= 60) return "Good · Room to improve";
  if (responseRate >= 40) return "Below average · Needs attention";
  return "Low · Affecting your ranking";
}

// ── Top-level assembly ────────────────────────────────────────────────────────

export interface BusinessControlCentreData {
  priority: Priority;
  shortlisted: ControlCentreQuote[];
  revenue: RevenueBreakdown;
  dailyHighestImpactAction: DailyHighestImpactAction;
  marketplaceActivity: MarketplaceActivity;
  businessOperations: BusinessOperations;
}

export function computeBusinessControlCentre(input: ControlCentreInput): BusinessControlCentreData {
  const now = Date.now();

  const shortlisted = input.quotes.filter((q) => q.status === "shortlisted");
  const pendingQuotes = input.quotes.filter((q) => q.status === "pending");
  const potentialQuotes = pendingQuotes;

  const pendingBookings = input.allBookings.filter((b) => b.status === "pending");
  const awaitingPaymentBookings = input.allBookings.filter((b) => b.status === "pending_payment");
  const confirmedBookings = input.allBookings.filter((b) => b.status === "confirmed" || b.status === "accepted");
  const upcoming = input.allBookings
    .filter((b) => b.event?.date && new Date(b.event.date).getTime() > now && (b.status === "accepted" || b.status === "confirmed"))
    .sort((a, b) => new Date(a.event!.date).getTime() - new Date(b.event!.date).getTime());

  const earned = input.allBookings
    .filter((b) => b.payment_status === "fully_paid")
    .reduce((sum, b) => sum + (b.vendor_payout ?? 0), 0);
  const pendingPayout = input.allBookings
    .filter((b) => b.payment_status === "deposit_paid" && b.status === "confirmed")
    .reduce((sum, b) => sum + (b.vendor_payout ?? 0), 0);

  const priority = computePriority(input, {
    shortlisted,
    pendingBookings,
    pendingQuotes,
    upcoming,
    pendingPayoutTotal: pendingPayout,
  });

  const revenue = computeRevenue({
    allBookings: input.allBookings,
    pendingBookings,
    shortlisted,
    potentialQuotes,
  });

  const health = computeBusinessHealthScore(input);
  const dailyHighestImpactAction = computeDailyHighestImpactAction(input, health, priority.message);

  const oldestPendingQuote = pendingQuotes.length > 0
    ? pendingQuotes.reduce((oldest, q) => (new Date(q.created_at) < new Date(oldest.created_at) ? q : oldest))
    : null;
  const oldestPendingQuoteHoursAgo = oldestPendingQuote
    ? Math.round((now - new Date(oldestPendingQuote.created_at).getTime()) / 3_600_000)
    : null;

  const totalViews = input.analyticsEvents.profileViews;
  const conversionRate = totalViews > 0 ? `${((confirmedBookings.length / totalViews) * 100).toFixed(1)}%` : "0.0%";

  const marketplaceActivity: MarketplaceActivity = {
    profileViews: input.analyticsEvents.profileViews,
    quoteRequests: input.analyticsEvents.quoteRequests,
    mediaViews: input.analyticsEvents.mediaViews,
    contactClicks: input.analyticsEvents.contactClicks,
    packageViews: input.analyticsEvents.packageViews,
    conversionRate,
    rankTier: input.rankScore.tier,
    visibilityReason: input.governance.visibilityReason,
    featured: input.vendor.featured,
  };

  const businessOperations: BusinessOperations = {
    pendingBookings: pendingBookings.length,
    confirmedBookings: confirmedBookings.length,
    awaitingPaymentBookings: awaitingPaymentBookings.length,
    nextEvent: upcoming.length > 0 && upcoming[0].event
      ? {
          daysUntil: Math.ceil((new Date(upcoming[0].event.date).getTime() - now) / 86_400_000),
          title: upcoming[0].event.title,
          date: upcoming[0].event.date,
          city: upcoming[0].event.city,
          bookingId: upcoming[0].id,
          guestCount: upcoming[0].event.guest_count,
          totalUpcomingCount: upcoming.length,
        }
      : null,
    responseTracker: {
      responseRate: input.vendor.response_rate,
      oldestPendingQuoteHoursAgo,
      tierLabel: responseTierLabel(input.vendor.response_rate),
    },
    unreadMessageCount: input.unreadMessageCount,
    hasAvailability: input.hasAvailability,
    earned,
    pendingPayout,
    activeWarnings: input.warnings,
  };

  return {
    priority,
    shortlisted,
    revenue,
    dailyHighestImpactAction,
    marketplaceActivity,
    businessOperations,
  };
}
