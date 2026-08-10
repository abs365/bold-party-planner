// ── Financial Ledger Helpers ──────────────────────────────────────────────────
// Centralised writes to financial_ledger and financial_events.
// All writes are non-fatal: errors are logged but never propagate to callers.
// This ensures webhook processing and business logic are never blocked by audit failures.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getApplicableCommissionRate, type CommissionVendorInput } from "@/lib/finance/commission";

export type LedgerPaymentStatus = "pending" | "paid" | "refunded" | "partially_refunded" | "chargeback" | "failed";
export type LedgerPayoutStatus  = "not_due" | "scheduled" | "paid" | "failed";

export type FinancialEventType =
  | "PAYMENT_RECEIVED"
  | "BOOKING_CONFIRMED"
  | "REFUND_REQUESTED"
  | "REFUND_COMPLETED"
  | "PAYOUT_CREATED"
  | "PAYOUT_SCHEDULED"
  | "PAYOUT_COMPLETED"
  | "PAYOUT_FAILED"
  | "CHARGEBACK_RECEIVED"
  | "CHARGEBACK_RESOLVED"
  | "PAYMENT_FAILED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_REJECTED"
  | "RECONCILIATION_RUN"
  | "LEDGER_CREATED"
  | "LEDGER_UPDATED"
  | "CONNECT_ACCOUNT_CREATED"
  | "CONNECT_ACCOUNT_UPDATED"
  | "CONNECT_ACCOUNT_ACTIVATED"
  | "CONNECT_ACCOUNT_RESTRICTED"
  | "CONNECT_ACCOUNT_DISABLED"
  | "REQUIREMENT_UPDATED";

export interface CreateLedgerEntryParams {
  bookingId:               string;
  customerId:              string;
  vendorId:                string;
  grossAmount:             number;
  // Founding-vendor status + waiver expiry for the rate decision — see
  // getApplicableCommissionRate(). Omit → standard rate, same as today.
  vendor?:                 CommissionVendorInput;
  // Date the rate is evaluated against (i.e. against founding_commission_expires_at).
  // Defaults to now; callers with an existing booking should pass its
  // created_at so a delayed/retried webhook still resolves the same rate.
  bookingDate?:            string | Date;
  currency?:               string;
  stripePaymentIntentId?:  string | null;
  stripeCheckoutSessionId?: string | null;
  paymentStatus?:          LedgerPaymentStatus;
  payoutStatus?:           LedgerPayoutStatus;
}

export async function createLedgerEntry(
  supabase: SupabaseClient,
  params: CreateLedgerEntryParams
): Promise<string | null> {
  try {
    const { rate, reason } = getApplicableCommissionRate(params.vendor, params.bookingDate ?? new Date());
    if (reason !== "standard") {
      // Non-default outcome (founding waiver active or just expired) — worth
      // a log line even though ledger writes are otherwise silent on success,
      // since this is the one place real money is affected by the waiver.
      console.log(`[ledger] commission rate for booking ${params.bookingId}: ${rate} (${reason})`);
    }
    const commission = Number((params.grossAmount * rate).toFixed(2));
    const vendor     = Number((params.grossAmount * (1 - rate)).toFixed(2));

    const { data, error } = await supabase.from("financial_ledger").insert({
      booking_id:                 params.bookingId,
      customer_id:                params.customerId,
      vendor_id:                  params.vendorId,
      stripe_payment_intent_id:   params.stripePaymentIntentId ?? null,
      stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
      gross_amount:               params.grossAmount,
      platform_commission_amount: commission,
      vendor_amount:              vendor,
      commission_rate:            rate,
      currency:                   params.currency ?? "gbp",
      payment_status:             params.paymentStatus ?? "paid",
      payout_status:              params.payoutStatus ?? "not_due",
    }).select("id").single();

    if (error) {
      console.error("[ledger] createLedgerEntry failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[ledger] createLedgerEntry threw:", err);
    return null;
  }
}

export async function updateLedgerPaymentStatus(
  supabase: SupabaseClient,
  stripePaymentIntentId: string,
  status: LedgerPaymentStatus,
  extra?: { refundAmount?: number; chargebackAmount?: number; stripeChargeId?: string }
): Promise<string | null> {
  try {
    const updates: Record<string, unknown> = {
      payment_status: status,
      updated_at: new Date().toISOString(),
    };
    if (extra?.refundAmount  != null) updates.refund_amount    = extra.refundAmount;
    if (extra?.chargebackAmount != null) updates.chargeback_amount = extra.chargebackAmount;
    if (extra?.stripeChargeId)  updates.stripe_charge_id       = extra.stripeChargeId;

    const { data, error } = await supabase.from("financial_ledger")
      .update(updates)
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[ledger] updateLedgerPaymentStatus failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[ledger] updateLedgerPaymentStatus threw:", err);
    return null;
  }
}

export async function appendLedgerEvent(
  supabase: SupabaseClient,
  eventType: FinancialEventType,
  metadata: Record<string, unknown>,
  ledgerId?: string | null
): Promise<void> {
  try {
    const { error } = await supabase.from("financial_events").insert({
      ledger_id:  ledgerId ?? null,
      event_type: eventType,
      metadata,
    });
    if (error) {
      console.error("[ledger] appendLedgerEvent failed:", eventType, error.message);
    }
  } catch (err) {
    console.error("[ledger] appendLedgerEvent threw:", eventType, err);
  }
}

export async function updateLedgerPayoutStatus(
  supabase: SupabaseClient,
  bookingId: string,
  status: LedgerPayoutStatus
): Promise<void> {
  try {
    const { error } = await supabase.from("financial_ledger")
      .update({ payout_status: status, updated_at: new Date().toISOString() })
      .eq("booking_id", bookingId);
    if (error) {
      console.error("[ledger] updateLedgerPayoutStatus failed:", error.message);
    }
  } catch (err) {
    console.error("[ledger] updateLedgerPayoutStatus threw:", err);
  }
}
