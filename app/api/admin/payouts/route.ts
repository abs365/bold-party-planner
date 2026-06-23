import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { createGovernanceDecision } from "@/lib/governance";

export async function GET() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { data, error } = await auth.db
    .from("vendor_payouts")
    .select(`
      id, booking_id, vendor_id, amount, status, notes, created_at,
      booking:bookings(id, total_amount, commission_amount, vendor_payout, payment_status,
        event:events(title, date),
        customer:profiles!bookings_customer_id_fkey(full_name)
      ),
      vendor:vendors(id, business_name, city)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { payout_id, action, notes } = await request.json() as {
    payout_id: string;
    action: "mark_paid" | "cancel";
    notes?: string;
  };

  if (!payout_id || !action) {
    return NextResponse.json({ error: "Missing payout_id or action" }, { status: 400 });
  }

  // Fetch before-state for audit trail
  const { data: payoutBefore } = await auth.db
    .from("vendor_payouts")
    .select("status, amount, vendor_id, booking_id")
    .eq("id", payout_id)
    .maybeSingle();

  const ip = ipFromRequest(request);

  if (action === "mark_paid") {
    const { error } = await auth.db
      .from("vendor_payouts")
      .update({ status: "paid", notes: notes ?? null })
      .eq("id", payout_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole:   auth.role,
      action:      "admin.payout.mark_paid",
      entityType:  "payout",
      entityId:    payout_id,
      before:      payoutBefore ? { status: payoutBefore.status } : undefined,
      after:       { status: "paid" },
      ipAddress:   ip,
    });

    void createGovernanceDecision({
      actorUserId:    auth.user.id,
      actorEmail:     auth.user.email ?? "",
      actorRole:      auth.role,
      actionType:     "payout.marked_paid",
      entityType:     "payout",
      entityId:       payout_id,
      previousStatus: payoutBefore?.status,
      newStatus:      "paid",
      adminNotes:     notes,
      ipAddress:      ip,
    });

    // Notify vendor that their payout has been sent
    if (payoutBefore?.vendor_id) {
      const { data: vendor } = await auth.db
        .from("vendors")
        .select("user_id, business_name")
        .eq("id", payoutBefore.vendor_id)
        .maybeSingle();

      if (vendor?.user_id) {
        await auth.db.rpc("notify_user", {
          p_user_id: vendor.user_id,
          p_title: "Payout Sent",
          p_message: `Your payout of £${Number(payoutBefore.amount).toFixed(2)} has been sent to your registered bank account.`,
          p_type: "payment",
          p_link: "/vendor/dashboard",
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  if (action === "cancel") {
    const { error } = await auth.db
      .from("vendor_payouts")
      .update({ status: "cancelled", notes: notes ?? null })
      .eq("id", payout_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole:   auth.role,
      action:      "admin.payout.cancel",
      entityType:  "payout",
      entityId:    payout_id,
      before:      payoutBefore ? { status: payoutBefore.status } : undefined,
      after:       { status: "cancelled" },
      ipAddress:   ip,
    });

    void createGovernanceDecision({
      actorUserId:    auth.user.id,
      actorEmail:     auth.user.email ?? "",
      actorRole:      auth.role,
      actionType:     "payout.cancelled",
      entityType:     "payout",
      entityId:       payout_id,
      previousStatus: payoutBefore?.status,
      newStatus:      "cancelled",
      adminNotes:     notes,
      ipAddress:      ip,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
