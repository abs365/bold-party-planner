import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { createGovernanceDecision } from "@/lib/governance";
import { track } from "@/lib/analytics";

// GET /api/admin/reviews
// ?status=flagged   — returns flagged reviews (default)
// ?status=all       — returns all
// ?status=removed   — returns removed
export async function GET(request: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const db = await createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "flagged";

  let query = db
    .from("reviews")
    .select(`
      id, booking_id, vendor_id, customer_id, rating, comment, response, response_at,
      communication_rating, professionalism_rating, punctuality_rating, quality_rating, value_rating,
      moderation_status, moderation_notes, moderated_by, moderated_at,
      is_verified, verified_at, created_at,
      vendor:vendors(id, business_name),
      customer:profiles!reviews_customer_id_fkey(full_name, email),
      reports:review_reports(id, reason, status)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    query = query.eq("moderation_status", status);
  }

  const { data: reviews, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: reviews ?? [] });
}

// POST /api/admin/reviews
// body: { action: "approve"|"flag"|"remove", review_id, notes? }
export async function POST(request: Request) {
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const db = await createAdminClient();
  const { action, review_id, notes } = await request.json() as {
    action: "approve" | "flag" | "remove";
    review_id: string;
    notes?: string;
  };

  if (!action || !review_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const statusMap = { approve: "approved", flag: "flagged", remove: "removed" } as const;
  const newStatus = statusMap[action];
  if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { data: review } = await db
    .from("reviews")
    .select("id, vendor_id, moderation_status, rating")
    .eq("id", review_id)
    .maybeSingle();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const { error } = await db
    .from("reviews")
    .update({
      moderation_status: newStatus,
      moderation_notes:  notes ?? null,
      moderated_by:      auth.user.id,
      moderated_at:      new Date().toISOString(),
    })
    .eq("id", review_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If resolving reports, close open ones
  if (action !== "flag") {
    await db
      .from("review_reports")
      .update({ status: action === "remove" ? "resolved" : "dismissed", resolved_by: auth.user.id, resolved_at: new Date().toISOString() })
      .eq("review_id", review_id)
      .eq("status", "open");
  }

  const auditAction =
    action === "approve" ? "admin.review.approve" :
    action === "flag"    ? "admin.review.flag"    :
                           "admin.review.remove";

  const ip = ipFromRequest(request);

  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole:   auth.role,
    action:      auditAction,
    entityType:  "review",
    entityId:    review_id,
    before:      { moderation_status: review.moderation_status },
    after:       { moderation_status: newStatus },
    ipAddress:   ip,
  });

  void createGovernanceDecision({
    actorUserId:    auth.user.id,
    actorEmail:     auth.user.email ?? "",
    actorRole:      auth.role,
    actionType:     `review.${action === "approve" ? "approved" : action === "flag" ? "flagged" : "removed"}`,
    entityType:     "review",
    entityId:       review_id,
    previousStatus: review.moderation_status,
    newStatus:      newStatus,
    adminNotes:     notes,
    ipAddress:      ip,
  });

  void track({
    event:  "governance.warning_resolved",
    userId: auth.user.id,
    properties: { entity_type: "review", review_id, action, vendor_id: review.vendor_id },
  });

  return NextResponse.json({ success: true });
}
