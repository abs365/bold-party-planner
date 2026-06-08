import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// ── Action catalogue ─────────────────────────────────────────────────────────

export type AuditAction =
  // Admin — vendor management
  | "admin.vendor.approve"
  | "admin.vendor.reject"
  | "admin.vendor.suspend"
  | "admin.vendor.unsuspend"
  | "admin.vendor.activate"
  | "admin.vendor.flag"
  | "admin.vendor.unflag"
  | "admin.vendor.trust_level_set"
  | "admin.vendor.warn"
  | "admin.vendor.resolve_warning"
  // Admin — verification
  | "admin.verification.approve"
  | "admin.verification.reject"
  | "admin.verification.request_resubmission"
  | "admin.verification.set_level"
  | "admin.verification.flag"
  | "admin.verification.unflag"
  // Admin — moderation
  | "admin.report.resolve"
  | "admin.report.dismiss"
  | "admin.media.approve"
  | "admin.media.reject"
  // Admin — alerts
  | "admin.alert.read"
  | "admin.alert.read_all"
  // Vendor
  | "vendor.profile.update"
  | "vendor.package.create"
  | "vendor.package.delete"
  | "vendor.media.upload"
  | "vendor.media.delete"
  | "vendor.verification.submit"
  | "vendor.verification.resubmit"
  // Customer / booking flow
  | "booking.status.change"
  | "booking.created"
  | "booking.cancelled"
  | "booking.refund.issued"
  | "quote.status.change"
  | "quote.created"
  | "quote.responded"
  | "quote.accepted"
  | "quote.rejected"
  | "quote.withdrawn"
  | "quote.declined"
  // Events
  | "event.created"
  // Auth
  | "user.signup"
  | "user.login"
  | "user.logout"
  // Uploads
  | "upload.success"
  | "upload.failure"
  // Payments
  | "payment.created"
  | "payment.completed"
  | "payment.failed"
  | "payment.refunded";

export interface AuditEntry {
  /** The user performing the action */
  actorUserId: string;
  /** The role of the actor */
  actorRole?: "admin" | "vendor" | "customer" | "system";
  /** The user being acted upon (e.g. vendor being approved) */
  targetUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  /** State before the change */
  before?: Record<string, unknown>;
  /** State after the change */
  after?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id:        entry.actorUserId,
      actor_role:     entry.actorRole ?? null,
      target_user_id: entry.targetUserId ?? null,
      action:         entry.action,
      entity_type:    entry.entityType,
      entity_id:      entry.entityId ?? null,
      old_values:     entry.before ?? null,
      new_values:     entry.after ?? null,
      ip_address:     entry.ipAddress ?? null,
    });
    if (error) {
      logger.warn("audit.write_failed", { err: error, action: entry.action });
    }
  } catch (err) {
    // Audit failures must never crash the parent operation
    logger.warn("audit.write_exception", { err, action: entry.action });
  }
}

export function ipFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
