import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";
import { createGovernanceDecision } from "@/lib/governance";
import { track } from "@/lib/analytics";
import { calculateVendorHealthScore } from "@/lib/vendor/health";
import { detectComputedWarnings, hasCriticalOrHighWarning } from "@/lib/vendor/warnings";
import { isAuthorisedCron } from "@/lib/cron-auth";

// Automated governance checks — runs on a schedule (e.g. daily via Vercel Cron).
// Protected by CRON_SECRET header. Creates audit logs for all automated actions.
// All actions are reversible — no vendor data is deleted.
//
// Cron schedule (add to vercel.json or vercel.ts):
//   { "path": "/api/cron/governance", "schedule": "0 3 * * *" }  (3 AM UTC daily)

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await createAdminClient();
  const log: string[] = [];
  let newWarnings = 0;
  let flagged = 0;
  let unflagged = 0;
  let alertsCreated = 0;

  // Fetch all approved vendors with relevant fields
  const { data: vendors, error: fetchError } = await db
    .from("vendors")
    .select("id, user_id, business_name, status, rating, review_count, response_rate, cancellation_rate, completed_jobs_count, suspicious_flag, last_active_at, created_at")
    .eq("status", "approved")
    .limit(500);

  if (fetchError || !vendors) {
    return NextResponse.json({ error: fetchError?.message ?? "Fetch failed" }, { status: 500 });
  }

  log.push(`Checking ${vendors.length} approved vendors`);

  // Fetch existing unresolved auto-generated warnings to avoid duplicates
  const { data: existingWarnings } = await db
    .from("vendor_warnings")
    .select("vendor_id, type")
    .eq("resolved", false)
    .eq("auto_generated", true);

  const existingSet = new Set(
    (existingWarnings ?? []).map((w) => `${w.vendor_id}:${w.type}`)
  );

  for (const vendor of vendors) {
    const health   = calculateVendorHealthScore(vendor);
    const warnings = detectComputedWarnings(vendor);
    const isAtRisk = health.isAtRisk || hasCriticalOrHighWarning(warnings);

    // Auto-generate stored warnings for critical/high issues not already tracked
    for (const w of warnings) {
      if (w.severity !== "critical" && w.severity !== "high") continue;
      const key = `${vendor.id}:${w.type}`;
      if (existingSet.has(key)) continue;

      const { error: warnErr } = await db.from("vendor_warnings").insert({
        vendor_id: vendor.id,
        type: w.type,
        severity: w.severity,
        title: w.title,
        message: w.message,
        auto_generated: true,
        resolved: false,
      });

      if (!warnErr) {
        existingSet.add(key);
        newWarnings++;
        void createGovernanceDecision({
          actorUserId:  "system",
          actorEmail:   "system@elbold.internal",
          actorRole:    "system",
          actionType:   "vendor.auto_warning_issued",
          entityType:   "vendor",
          entityId:     vendor.id,
          reason:       w.message,
          adminNotes:   `Auto-generated: ${w.type} (${w.severity})`,
          isAutomated:  true,
        });
        void track({
          event: "governance.warning_issued",
          userId: vendor.user_id,
          properties: { vendor_id: vendor.id, type: w.type, severity: w.severity, auto: true },
        });
      }
    }

    // Auto-flag vendor if critical health and not already flagged
    if (health.total < 20 && !vendor.suspicious_flag) {
      const { error: flagErr } = await db
        .from("vendors")
        .update({ suspicious_flag: true, suspicious_reason: "Auto-flagged: critical health score" })
        .eq("id", vendor.id);

      if (!flagErr) {
        flagged++;
        void createAuditLog({
          actorUserId: "system",
          actorRole: "system",
          action: "admin.vendor.flag",
          entityType: "vendor",
          entityId: vendor.id,
          after: { suspicious_flag: true, reason: "Auto-flagged: critical health score", health_total: health.total },
        });
        void createGovernanceDecision({
          actorUserId:  "system",
          actorEmail:   "system@elbold.internal",
          actorRole:    "system",
          actionType:   "vendor.auto_flagged",
          entityType:   "vendor",
          entityId:     vendor.id,
          reason:       `Auto-flagged: critical health score (${health.total}/100)`,
          isAutomated:  true,
        });
      }
    }

    // Auto-clear suspicious_flag if health recovered (health ≥ 50) and no critical warnings
    if (vendor.suspicious_flag && health.total >= 50 && !warnings.some((w) => w.severity === "critical")) {
      const { error: unflagErr } = await db
        .from("vendors")
        .update({ suspicious_flag: false, suspicious_reason: null })
        .eq("id", vendor.id);

      if (!unflagErr) {
        unflagged++;
        void createAuditLog({
          actorUserId: "system",
          actorRole: "system",
          action: "admin.vendor.unflag",
          entityType: "vendor",
          entityId: vendor.id,
          after: { suspicious_flag: false, reason: "Auto-cleared: health recovered", health_total: health.total },
        });
        void createGovernanceDecision({
          actorUserId:  "system",
          actorEmail:   "system@elbold.internal",
          actorRole:    "system",
          actionType:   "vendor.auto_unflagged",
          entityType:   "vendor",
          entityId:     vendor.id,
          reason:       `Auto-cleared: health recovered (${health.total}/100)`,
          isAutomated:  true,
        });
        void track({ event: "governance.vendor_recovered", userId: vendor.user_id, properties: { vendor_id: vendor.id } });
      }
    }

    // Create admin alert for newly at-risk vendors (critical only, to avoid noise)
    if (isAtRisk && health.total < 30) {
      const { data: recentAlert } = await db
        .from("admin_alerts")
        .select("id")
        .eq("vendor_id", vendor.id)
        .eq("type", "vendor_at_risk")
        .eq("read", false)
        .limit(1)
        .single();

      if (!recentAlert) {
        const { error: alertErr } = await db.from("admin_alerts").insert({
          type: "vendor_at_risk",
          title: `At-risk vendor: ${vendor.business_name}`,
          body: `Health score ${health.total}/100 (${health.tierLabel}). Risk flags: ${health.riskFlags.join(", ")}`,
          severity: "high",
          vendor_id: vendor.id,
        });
        if (!alertErr) alertsCreated++;
      }
    }
  }

  void track({
    event: "governance.auto_check_run",
    properties: { vendors_checked: vendors.length, new_warnings: newWarnings, flagged, unflagged, alerts_created: alertsCreated },
  });

  log.push(`Auto-warnings issued: ${newWarnings}`);
  log.push(`Vendors auto-flagged: ${flagged}`);
  log.push(`Vendors auto-cleared: ${unflagged}`);
  log.push(`Admin alerts created: ${alertsCreated}`);

  return NextResponse.json({ success: true, log });
}
