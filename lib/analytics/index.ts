import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// ── Event catalogue (extend as the platform grows) ───────────────────────────

export type AnalyticsEvent =
  // Acquisition / onboarding
  | "user.signup"
  | "vendor.registered"
  | "vendor.onboarding.viewed"
  | "vendor.onboarding.step_completed"
  | "vendor.onboarding.completed"
  // Vendor activation funnel
  | "vendor.activation.profile_saved"
  | "vendor.activation.first_package_created"
  | "vendor.activation.first_media_uploaded"
  | "vendor.activation.verification_started"
  | "vendor.activation.marketplace_ready"
  // Marketplace
  | "marketplace.search"
  | "marketplace.vendor_profile_viewed"
  | "marketplace.category_filtered"
  | "marketplace.vendor_saved"
  | "marketplace.vendor_unsaved"
  // Quote funnel
  | "quote.requested"
  | "quote.responded"
  | "quote.accepted"
  | "quote.rejected"
  | "quote.declined"
  | "quote.withdrawn"
  | "quote.expired"
  // Booking funnel
  | "booking.created"
  | "booking.confirmed"
  | "booking.completed"
  | "booking.cancelled"
  // Payments
  | "payment.initiated"
  | "payment.completed"
  | "payment.failed"
  | "payment.refunded"
  // Events
  | "event.created"
  | "event.updated"
  // Verification
  | "vendor.verification.submitted"
  | "vendor.verification.approved"
  | "vendor.verification.rejected"
  | "vendor.level_upgraded"
  // Admin actions
  | "admin.vendor.approved"
  | "admin.vendor.rejected"
  | "admin.vendor.bulk_approve"
  | "admin.vendor.bulk_reject"
  | "admin.vendor.bulk_suspend"
  // Governance
  | "governance.warning_issued"
  | "governance.warning_resolved"
  | "governance.vendor_flagged"
  | "governance.vendor_unflagged"
  | "governance.auto_check_run"
  | "governance.vendor_at_risk_detected"
  | "governance.vendor_recovered"
  // Reviews
  | "review.submitted"
  | "review.reported"
  | "review.moderated"
  | "review.response_added"
  // Subscriptions
  | "vendor.subscription.page_viewed"
  | "vendor.subscription.checkout_started"
  | "vendor.subscription.upgraded"
  | "vendor.subscription.downgraded"
  | "vendor.subscription.cancelled"
  | "vendor.subscription.reactivated"
  | "vendor.subscription.payment_failed"
  | "vendor.subscription.payment_recovered"
  // Uploads
  | "upload.completed"
  | "upload.failed";

export interface TrackPayload {
  event: AnalyticsEvent;
  userId?: string;
  properties?: Record<string, unknown>;
}

/**
 * Fire-and-forget analytics event. Failures are silently swallowed —
 * analytics must never affect the critical path.
 */
export async function track(payload: TrackPayload): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await supabase.from("analytics_events").insert({
      event:      payload.event,
      user_id:    payload.userId ?? null,
      properties: payload.properties ?? {},
    });
  } catch (err) {
    logger.warn("analytics.track_failed", { err, event: payload.event });
  }
}

/**
 * Returns aggregate counts for the admin dashboard.
 * Queries are scoped to the last N days.
 */
export async function getEventCounts(
  events: AnalyticsEvent[],
  daysBack = 30
): Promise<Record<string, number>> {
  try {
    const supabase = await createAdminClient();
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("analytics_events")
      .select("event")
      .in("event", events)
      .gte("created_at", since);

    const counts: Record<string, number> = {};
    for (const ev of events) counts[ev] = 0;
    for (const row of data ?? []) {
      counts[row.event as string] = (counts[row.event as string] ?? 0) + 1;
    }
    return counts;
  } catch {
    return Object.fromEntries(events.map((e) => [e, 0]));
  }
}
