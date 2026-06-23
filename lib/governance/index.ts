import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type GovernanceActorRole = "founder" | "global_admin" | "ops_admin" | "reviewer" | "system";

export type GovernanceEntityType =
  | "vendor"
  | "vendor_verification"
  | "customer"
  | "subscription"
  | "admin_role"
  | "review"
  | "dispute"
  | "appeal"
  | "payout";

export type EvidenceRef = {
  type: "document" | "screenshot" | "url" | "external";
  ref: string;
  description?: string;
};

export interface GovernanceDecisionEntry {
  actorUserId: string;
  actorEmail: string;
  actorName?: string;
  actorRole: GovernanceActorRole;
  actionType: string;
  entityType: GovernanceEntityType;
  entityId: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  handbookSection?: string;
  adminNotes?: string;
  evidenceRefs?: EvidenceRef[];
  relatedDecisionId?: string;
  appealOutcomeFor?: string;
  ipAddress?: string;
  isAutomated?: boolean;
}

const HANDBOOK_SECTION_MAP: Record<string, string> = {
  "vendor.approved":                     "1.3",
  "vendor.rejected":                     "1.4",
  "vendor.reinstated":                   "3.4",
  "vendor.suspended":                    "3.1",
  "vendor.warning_issued":               "3.1",
  "vendor.warning_resolved":             "3.1",
  "vendor.bulk_approved":                "1.3",
  "vendor.bulk_rejected":                "1.4",
  "vendor.bulk_suspended":               "3.1",
  "vendor.flagged":                      "3.1",
  "vendor.unflagged":                    "3.1",
  "vendor.auto_flagged":                 "3.1",
  "vendor.auto_unflagged":               "3.1",
  "vendor.auto_warning_issued":          "3.1",
  "verification.document_approved":      "2.3",
  "verification.document_rejected":      "2.3",
  "verification.resubmission_requested": "2.3",
  "verification.level_upgraded":         "2.3",
  "verification.level_downgraded":       "2.3",
  "appeal.resolved_overturn":            "4.1",
  "appeal.resolved_uphold":              "4.1",
  "appeal.received":                     "4.1",
  "dispute.resolved":                    "5.1",
  "dispute.dismissed":                   "5.1",
  "review.approved":                     "6.1",
  "review.removed":                      "6.1",
  "review.flagged":                      "6.1",
};

export async function createGovernanceDecision(
  entry: GovernanceDecisionEntry
): Promise<string | null> {
  try {
    const db = await createAdminClient();
    const { data, error } = await db
      .from("governance_decisions")
      .insert({
        actor_user_id:       entry.actorUserId,
        actor_email:         entry.actorEmail,
        actor_name:          entry.actorName ?? null,
        actor_role:          entry.actorRole,
        action_type:         entry.actionType,
        entity_type:         entry.entityType,
        entity_id:           entry.entityId,
        previous_status:     entry.previousStatus ?? null,
        new_status:          entry.newStatus ?? null,
        reason:              entry.reason ?? null,
        handbook_section:    entry.handbookSection ?? HANDBOOK_SECTION_MAP[entry.actionType] ?? null,
        admin_notes:         entry.adminNotes ?? null,
        evidence_refs:       entry.evidenceRefs ?? [],
        related_decision_id: entry.relatedDecisionId ?? null,
        appeal_outcome_for:  entry.appealOutcomeFor ?? null,
        ip_address:          entry.ipAddress ?? null,
        is_automated:        entry.isAutomated ?? false,
      })
      .select("id")
      .single();

    if (error) {
      logger.warn("governance.write_failed", { err: error, actionType: entry.actionType });
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (err) {
    logger.warn("governance.write_exception", { err, actionType: entry.actionType });
    return null;
  }
}
