import { createAdminClient } from "@/lib/supabase/server";
import type { ManualContactActivityType } from "@/types";

// Fire-and-forget activity logging for manual_contacts, mirroring the
// existing createAuditLog()/createGovernanceDecision() pattern (createAdminClient(),
// swallow errors, never block the caller's response on a logging failure).
//
// This is the Customer Timeline's write path (Wave 2, Priority 2) and the
// substrate a future Automation Engine reads/writes without a schema change -
// event_type is a fixed, extensible vocabulary; actor distinguishes
// vendor-initiated events from system-initiated ones (e.g. an automated
// reminder).
export async function logContactActivity(entry: {
  vendorId: string;
  manualContactId: string;
  eventType: ManualContactActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  actor?: "vendor" | "system";
}): Promise<void> {
  try {
    const db = await createAdminClient();
    await db.from("manual_contact_activity").insert({
      vendor_id: entry.vendorId,
      manual_contact_id: entry.manualContactId,
      event_type: entry.eventType,
      description: entry.description,
      metadata: entry.metadata ?? {},
      actor: entry.actor ?? "vendor",
    });
  } catch {
    // Never let activity logging break the caller's request.
  }
}
