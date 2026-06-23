import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { appendLedgerEvent } from "@/lib/finance/ledger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Allow both authenticated admin users and the cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  const isAuthorisedCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  let db: Awaited<ReturnType<typeof createAdminClient>>;

  if (isAuthorisedCron) {
    db = await createAdminClient();
  } else {
    // Financial reconciliation — Global Admin minimum
    const auth = await requireAdminRole("global_admin");
    if (!auth) return forbidden();
    db = auth.db;
  }

  // ── Source 1: payments table (what Stripe actually paid us) ──────────────
  const { data: allPayments } = await db
    .from("payments")
    .select("amount, type, status, booking_id, created_at");

  const payments = allPayments ?? [];
  const succeededPayments = payments.filter(
    (p) => p.status === "succeeded" && (p.type === "deposit" || p.type === "full")
  );
  const refundPayments = payments.filter(
    (p) => p.status === "succeeded" && p.type === "refund"
  );

  const paymentsGMV     = succeededPayments.reduce((s, p) => s + Number(p.amount), 0);
  const refundTotal     = refundPayments.reduce((s, p) => s + Number(p.amount), 0);
  const expectedCommission = paymentsGMV * 0.10;

  // ── Source 2: bookings table ──────────────────────────────────────────────
  const { data: allBookings } = await db
    .from("bookings")
    .select("id, commission_amount, total_amount, payment_status, vendor_payout");

  const bookings = allBookings ?? [];
  const paidBookings = bookings.filter(
    (b) => b.payment_status === "deposit_paid" || b.payment_status === "fully_paid"
  );

  const actualCommission  = paidBookings.reduce((s, b) => s + Number(b.commission_amount ?? 0), 0);
  const commissionDrift   = Math.abs(expectedCommission - actualCommission);

  // ── Source 3: financial_ledger ────────────────────────────────────────────
  const { data: ledgerRows } = await db
    .from("financial_ledger")
    .select("gross_amount, refund_amount, platform_commission_amount, vendor_amount, payment_status, payout_status");

  const ledger = ledgerRows ?? [];
  const ledgerGMV          = ledger.filter(l => l.payment_status === "paid").reduce((s, l) => s + Number(l.gross_amount), 0);
  const ledgerRefunds       = ledger.reduce((s, l) => s + Number(l.refund_amount ?? 0), 0);
  const ledgerPendingPayout = ledger
    .filter(l => l.payout_status === "not_due" || l.payout_status === "scheduled")
    .reduce((s, l) => s + Number(l.vendor_amount ?? 0), 0);

  const gmvDrift = Math.abs(paymentsGMV - ledgerGMV);

  // ── Source 4: vendor payouts outstanding ──────────────────────────────────
  const { data: pendingPayouts } = await db
    .from("vendor_payouts")
    .select("amount, status, created_at")
    .eq("status", "pending");

  const pendingPayoutTotal = (pendingPayouts ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const overduePayouts     = (pendingPayouts ?? []).filter(
    (p) => new Date(p.created_at) < new Date(Date.now() - 7 * 86400000)
  );

  // ── Integrity checks ──────────────────────────────────────────────────────
  const paidBookingIds = new Set(succeededPayments.map((p) => p.booking_id));
  const orphanedConfirmedBookings = paidBookings.filter((b) => !paidBookingIds.has(b.id)).length;

  let discrepanciesFound = 0;
  const discrepancyDetails: Record<string, unknown> = {};

  if (commissionDrift > 0.01) {
    discrepanciesFound++;
    discrepancyDetails.commission_drift = commissionDrift;
  }
  if (orphanedConfirmedBookings > 0) {
    discrepanciesFound++;
    discrepancyDetails.orphaned_confirmed_bookings = orphanedConfirmedBookings;
  }
  if (overduePayouts.length > 0) {
    discrepanciesFound++;
    discrepancyDetails.overdue_payouts = overduePayouts.length;
  }

  const totalDiscrepancyAmount = commissionDrift + (orphanedConfirmedBookings * 100);
  const status = discrepanciesFound === 0    ? "healthy"
    : totalDiscrepancyAmount < 50            ? "warning"
    : "critical";

  const runDetails = {
    payments_gmv:           paymentsGMV,
    ledger_gmv:             ledgerGMV,
    gmv_drift:              gmvDrift,
    expected_commission:    expectedCommission,
    actual_commission:      actualCommission,
    commission_drift:       commissionDrift,
    refund_total:           refundTotal,
    ledger_refund_total:    ledgerRefunds,
    ledger_pending_payout:  ledgerPendingPayout,
    pending_payout_total:   pendingPayoutTotal,
    overdue_payout_count:   overduePayouts.length,
    orphaned_confirmed_bookings: orphanedConfirmedBookings,
    discrepancy_details:    discrepancyDetails,
  };

  const { data: run, error: runError } = await db.from("reconciliation_runs").insert({
    payments_gmv:          paymentsGMV,
    ledger_gmv:            ledgerGMV,
    expected_commission:   expectedCommission,
    actual_commission:     actualCommission,
    pending_payout_total:  pendingPayoutTotal,
    refund_total:          refundTotal,
    discrepancies_found:   discrepanciesFound,
    discrepancy_amount:    totalDiscrepancyAmount,
    status,
    details:               runDetails,
  }).select("id").single();

  if (runError) {
    console.error("[reconciliation] Failed to store run:", runError.message);
  }

  void appendLedgerEvent(db, "RECONCILIATION_RUN", {
    status,
    discrepancies_found: discrepanciesFound,
    discrepancy_amount: totalDiscrepancyAmount,
    run_id: run?.id ?? null,
  });

  return NextResponse.json({
    status,
    discrepancies_found: discrepanciesFound,
    discrepancy_amount: totalDiscrepancyAmount,
    run_id: run?.id ?? null,
    details: runDetails,
    run_at: new Date().toISOString(),
  });
}
