// ── Canonical Commission Rate Resolution ──────────────────────────────────
// ONE function decides what marketplace commission rate applies to a
// booking. Every place that needs a rate — lib/utils#calculateCommission
// (booking-creation path) and lib/finance/ledger#createLedgerEntry (payment
// ledger path) — calls getApplicableCommissionRate() below. Do not
// re-implement this decision anywhere else.
//
// Two distinct "Founding 100" vendor concepts, deliberately kept separate
// per Founder directive — never conflate them into one flag:
//
//   - vendors.is_founding_vendor            PERMANENT recognition badge.
//     Earned by being one of the first genuine 100 vendors. Never expires.
//     Has no effect on money. Unchanged by this module.
//
//   - vendors.founding_commission_expires_at   TIME-BOXED financial waiver.
//     The end of a 6-month 0% introductory commission period. Independent
//     of the badge: a vendor can remain a permanent Founding Vendor after
//     this date has passed and simply pay standard commission again.
//     NULL = never granted an active waiver → standard rate.
//
// Safety property (Founder-mandated, see commission.test.ts): an expired
// timestamp must never silently produce 0% commission. If
// founding_commission_expires_at is in the past relative to the booking
// date, the STANDARD rate applies — the same as if the vendor had no
// waiver at all.

import { COMMISSION_RATE } from "@/types";

export const STANDARD_COMMISSION_RATE = COMMISSION_RATE;

export type CommissionRateReason =
  | "standard"                 // no founding waiver in play — today's default for every vendor
  | "founding_waiver_active"   // founding vendor, waiver set, booking date is before expiry
  | "founding_waiver_expired"; // founding vendor, waiver set, but it has lapsed — standard rate resumes

export interface CommissionRateResult {
  rate: number;
  reason: CommissionRateReason;
}

/**
 * Minimal vendor shape this function needs. Pass the full `Vendor` row, a
 * partial Supabase `select("is_founding_vendor, founding_commission_expires_at")`,
 * or a plain object with these two fields.
 */
export interface CommissionVendorInput {
  is_founding_vendor?: boolean | null;
  founding_commission_expires_at?: string | Date | null;
}

/**
 * Resolve the commission rate that applies to a specific booking, and WHY —
 * per the Founder's explicit auditability requirement, callers must be able
 * to tell "why that rate was applied", not just receive a bare number.
 *
 * @param vendor      the vendor being booked (is_founding_vendor + the waiver expiry)
 * @param bookingDate the date the booking/charge is being evaluated against — defaults to now
 */
export function getApplicableCommissionRate(
  vendor: CommissionVendorInput | null | undefined,
  bookingDate: string | Date = new Date()
): CommissionRateResult {
  // No vendor, not a founding vendor, or no waiver ever set → today's
  // behavior for every existing vendor, unchanged.
  if (!vendor || !vendor.is_founding_vendor || !vendor.founding_commission_expires_at) {
    return { rate: STANDARD_COMMISSION_RATE, reason: "standard" };
  }

  const expiresAt = new Date(vendor.founding_commission_expires_at);
  const bookingAt = new Date(bookingDate);

  // Malformed timestamp on either side — fail closed to standard rate.
  // Never let bad data produce an accidental 0%.
  if (Number.isNaN(expiresAt.getTime()) || Number.isNaN(bookingAt.getTime())) {
    return { rate: STANDARD_COMMISSION_RATE, reason: "standard" };
  }

  if (bookingAt.getTime() < expiresAt.getTime()) {
    return { rate: 0, reason: "founding_waiver_active" };
  }

  // Expiry has passed (or is exactly now) — waiver protection: the
  // introductory period is over, standard commission resumes. This is what
  // stops an expired timestamp from becoming a silent, permanent 0%.
  return { rate: STANDARD_COMMISSION_RATE, reason: "founding_waiver_expired" };
}
