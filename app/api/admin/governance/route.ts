import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { createGovernanceDecision } from "@/lib/governance";
import { track } from "@/lib/analytics";
import { calculateVendorHealthScore } from "@/lib/vendor/health";
import { detectComputedWarnings } from "@/lib/vendor/warnings";
import { resolveGovernance } from "@/lib/vendor/governance";
import { computeVendorCompletion } from "@/lib/vendor/completion";
import { calculateVendorScore } from "@/lib/vendor/ranking";
import type { WarningType, WarningSeverity } from "@/lib/vendor/warnings";

// ── GET — governance overview ─────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "at_risk";

  if (tab === "warnings") {
    const { data, error } = await auth.db
      .from("vendor_warnings")
      .select(`
        *,
        vendor:vendors(id, business_name, city, category, status),
        resolved_by_profile:profiles!vendor_warnings_resolved_by_fkey(full_name)
      `)
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ warnings: data ?? [] });
  }

  // Default: at_risk — vendors needing attention
  const { data: atRiskVendors, error } = await auth.db
    .from("vendors")
    .select("id, business_name, city, category, status, rating, review_count, response_rate, cancellation_rate, completed_jobs_count, suspicious_flag, suspicious_reason, last_active_at, verification_level, bio, phone, min_price, instagram_url, website_url, subscription_plan, created_at, updated_at, profile:profiles(full_name, email)")
    .eq("status", "approved")
    .or("suspicious_flag.eq.true,cancellation_rate.gt.20,response_rate.lt.50")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (atRiskVendors ?? []).map((v) => {
    const health   = calculateVendorHealthScore(v);
    const warnings = detectComputedWarnings(v);
    return { ...v, health, warnings };
  });

  // Health distribution for overview
  const { data: allApproved } = await auth.db
    .from("vendors")
    .select("id, rating, review_count, response_rate, cancellation_rate, completed_jobs_count, suspicious_flag, last_active_at, created_at")
    .eq("status", "approved")
    .limit(500);

  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 };
  for (const v of allApproved ?? []) {
    const h = calculateVendorHealthScore(v);
    distribution[h.tier]++;
  }

  return NextResponse.json({
    atRiskVendors: enriched,
    healthDistribution: distribution,
    totalApproved: allApproved?.length ?? 0,
  });
}

// ── POST — governance actions ─────────────────────────────────────────────────

export async function POST(request: Request) {
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const body = await request.json() as {
    action: "warn" | "resolve_warning" | "flag" | "unflag" | "dismiss_warning";
    vendor_id?: string;
    warning_id?: string;
    type?: WarningType;
    severity?: WarningSeverity;
    title?: string;
    message?: string;
    admin_notes?: string;
    reason?: string;
    resolution_notes?: string;
  };

  const { action } = body;
  const ip = ipFromRequest(request);

  if (action === "warn") {
    const { vendor_id, type, severity = "medium", title, message, admin_notes } = body;
    if (!vendor_id || !type || !title || !message) {
      return NextResponse.json({ error: "vendor_id, type, title, message required" }, { status: 400 });
    }

    const { data: warning, error } = await auth.db
      .from("vendor_warnings")
      .insert({
        vendor_id,
        type,
        severity,
        title,
        message,
        admin_notes: admin_notes ?? null,
        auto_generated: false,
        resolved: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.role,
      action: "admin.vendor.warn",
      entityType: "vendor",
      entityId: vendor_id,
      after: { type, severity, title },
      ipAddress: ip,
    });
    void createGovernanceDecision({
      actorUserId:    auth.user.id,
      actorEmail:     auth.user.email ?? "",
      actorRole:      auth.role,
      actionType:     "vendor.warning_issued",
      entityType:     "vendor",
      entityId:       vendor_id,
      reason:         message,
      adminNotes:     admin_notes,
      ipAddress:      ip,
    });
    void track({ event: "governance.warning_issued", userId: auth.user.id, properties: { vendor_id, type, severity } });

    // Create admin_alert visible on main dashboard
    void auth.db.from("admin_alerts").insert({
      type: "governance_warning",
      title: `Warning issued: ${title}`,
      body: message,
      severity: severity === "critical" ? "high" : severity === "high" ? "medium" : "low",
      vendor_id,
    });

    return NextResponse.json({ warning });
  }

  if (action === "resolve_warning") {
    const { warning_id, resolution_notes } = body;
    if (!warning_id) return NextResponse.json({ error: "warning_id required" }, { status: 400 });

    const { data: warning, error } = await auth.db
      .from("vendor_warnings")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: auth.user.id,
        resolution_notes: resolution_notes ?? null,
      })
      .eq("id", warning_id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.role,
      action: "admin.vendor.resolve_warning",
      entityType: "vendor_warning",
      entityId: warning_id,
      after: { resolved: true },
      ipAddress: ip,
    });
    void createGovernanceDecision({
      actorUserId:    auth.user.id,
      actorEmail:     auth.user.email ?? "",
      actorRole:      auth.role,
      actionType:     "vendor.warning_resolved",
      entityType:     "vendor",
      entityId:       warning?.vendor_id ?? warning_id,
      adminNotes:     resolution_notes,
      ipAddress:      ip,
    });
    void track({ event: "governance.warning_resolved", userId: auth.user.id, properties: { warning_id } });

    return NextResponse.json({ warning });
  }

  if (action === "flag") {
    const { vendor_id, reason } = body;
    if (!vendor_id) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });

    const { error } = await auth.db
      .from("vendors")
      .update({ suspicious_flag: true, suspicious_reason: reason ?? null })
      .eq("id", vendor_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.role,
      action: "admin.vendor.flag",
      entityType: "vendor",
      entityId: vendor_id,
      after: { suspicious_flag: true, reason },
      ipAddress: ip,
    });
    void createGovernanceDecision({
      actorUserId: auth.user.id,
      actorEmail:  auth.user.email ?? "",
      actorRole:   auth.role,
      actionType:  "vendor.flagged",
      entityType:  "vendor",
      entityId:    vendor_id,
      reason:      reason,
      ipAddress:   ip,
    });
    void track({ event: "governance.vendor_flagged", userId: auth.user.id, properties: { vendor_id } });

    return NextResponse.json({ success: true });
  }

  if (action === "unflag") {
    const { vendor_id } = body;
    if (!vendor_id) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });

    const { error } = await auth.db
      .from("vendors")
      .update({ suspicious_flag: false, suspicious_reason: null })
      .eq("id", vendor_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.role,
      action: "admin.vendor.unflag",
      entityType: "vendor",
      entityId: vendor_id,
      after: { suspicious_flag: false },
      ipAddress: ip,
    });
    void createGovernanceDecision({
      actorUserId: auth.user.id,
      actorEmail:  auth.user.email ?? "",
      actorRole:   auth.role,
      actionType:  "vendor.unflagged",
      entityType:  "vendor",
      entityId:    vendor_id,
      ipAddress:   ip,
    });
    void track({ event: "governance.vendor_unflagged", userId: auth.user.id, properties: { vendor_id } });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
