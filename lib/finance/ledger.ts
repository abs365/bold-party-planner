// ── Financial Ledger Helpers ──────────────────────────────────────────────────
// Centralised writes to financial_ledger and financial_events.
// All writes are non-fatal: errors are logged but never propagate to callers.
// This ensures webhook processing and business logic are never blocked by audit failures.

import type { SupabaseClient } from "@supabase/supabase-js";

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
  | "LEDGER_UPDATED";

export interface CreateLedgerEntryParams {
  bookingId:               string;
  customerId:              string;
  vendorId:                string;
  grossAmount:             number;
  commissionRate?:         number;   // defaults to 0.10 (10%)
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
    const rate       = params.commissionRate ?? 0.10;
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
