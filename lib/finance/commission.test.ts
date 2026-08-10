import { describe, it, expect } from "vitest";
import { getApplicableCommissionRate, STANDARD_COMMISSION_RATE, type CommissionVendorInput } from "@/lib/finance/commission";
import { calculateCommission } from "@/lib/utils";
import { createLedgerEntry, type CreateLedgerEntryParams } from "@/lib/finance/ledger";

// ── Test helpers ────────────────────────────────────────────────────────
// A minimal stand-in for the Supabase admin client, just enough for
// createLedgerEntry to run its insert and report back what it computed.
function fakeSupabase(capture: { commission_rate?: number; platform_commission_amount?: number; vendor_amount?: number }) {
  return {
    from() {
      return {
        insert(row: Record<string, unknown>) {
          capture.commission_rate = row.commission_rate as number;
          capture.platform_commission_amount = row.platform_commission_amount as number;
          capture.vendor_amount = row.vendor_amount as number;
          return {
            select() {
              return {
                async single() {
                  return { data: { id: "ledger-test-id" }, error: null };
                },
              };
            },
          };
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const NOW = new Date("2026-08-10T00:00:00.000Z");
const SIX_MONTHS_FROM_NOW = new Date("2027-02-10T00:00:00.000Z");
const YESTERDAY = new Date("2026-08-09T00:00:00.000Z");

describe("getApplicableCommissionRate — the one canonical rate decision", () => {
  it("returns standard rate for a non-founding vendor", () => {
    const result = getApplicableCommissionRate({ is_founding_vendor: false, founding_commission_expires_at: null }, NOW);
    expect(result).toEqual({ rate: STANDARD_COMMISSION_RATE, reason: "standard" });
  });

  it("returns standard rate for a founding vendor with no expiry set (today's real-world default for every existing vendor)", () => {
    const result = getApplicableCommissionRate({ is_founding_vendor: true, founding_commission_expires_at: null }, NOW);
    expect(result).toEqual({ rate: STANDARD_COMMISSION_RATE, reason: "standard" });
  });

  it("returns 0% for a founding vendor within their active waiver window", () => {
    const result = getApplicableCommissionRate(
      { is_founding_vendor: true, founding_commission_expires_at: SIX_MONTHS_FROM_NOW.toISOString() },
      NOW
    );
    expect(result).toEqual({ rate: 0, reason: "founding_waiver_active" });
  });

  it("SAFETY: returns standard rate — never 0% — for a founding vendor whose waiver expired yesterday", () => {
    const result = getApplicableCommissionRate(
      { is_founding_vendor: true, founding_commission_expires_at: YESTERDAY.toISOString() },
      NOW
    );
    expect(result).toEqual({ rate: STANDARD_COMMISSION_RATE, reason: "founding_waiver_expired" });
    expect(result.rate).not.toBe(0);
  });

  it("SAFETY: treats an expiry of exactly 'now' as already expired, not active", () => {
    const result = getApplicableCommissionRate(
      { is_founding_vendor: true, founding_commission_expires_at: NOW.toISOString() },
      NOW
    );
    expect(result.rate).toBe(STANDARD_COMMISSION_RATE);
    expect(result.reason).toBe("founding_waiver_expired");
  });

  it("fails safe to standard rate on a malformed expiry timestamp rather than throwing or returning 0%", () => {
    const result = getApplicableCommissionRate(
      { is_founding_vendor: true, founding_commission_expires_at: "not-a-date" },
      NOW
    );
    expect(result).toEqual({ rate: STANDARD_COMMISSION_RATE, reason: "standard" });
  });

  it("returns standard rate when vendor is null/undefined", () => {
    expect(getApplicableCommissionRate(null, NOW)).toEqual({ rate: STANDARD_COMMISSION_RATE, reason: "standard" });
    expect(getApplicableCommissionRate(undefined, NOW)).toEqual({ rate: STANDARD_COMMISSION_RATE, reason: "standard" });
  });
});

describe("calculateCommission — booking-creation path", () => {
  it("matches STANDARD_COMMISSION_RATE for every existing vendor shape (zero live effect of adding the column)", () => {
    const nonFounding = calculateCommission(1000, { is_founding_vendor: false, founding_commission_expires_at: null }, NOW);
    const foundingNoExpiry = calculateCommission(1000, { is_founding_vendor: true, founding_commission_expires_at: null }, NOW);
    expect(nonFounding).toBe(1000 * STANDARD_COMMISSION_RATE);
    expect(foundingNoExpiry).toBe(1000 * STANDARD_COMMISSION_RATE);
    expect(foundingNoExpiry).toBe(nonFounding);
  });

  it("is 0 for a founding vendor inside their active waiver", () => {
    const commission = calculateCommission(
      1000,
      { is_founding_vendor: true, founding_commission_expires_at: SIX_MONTHS_FROM_NOW.toISOString() },
      NOW
    );
    expect(commission).toBe(0);
  });

  it("resumes standard commission for a founding vendor whose waiver has expired", () => {
    const commission = calculateCommission(
      1000,
      { is_founding_vendor: true, founding_commission_expires_at: YESTERDAY.toISOString() },
      NOW
    );
    expect(commission).toBe(1000 * STANDARD_COMMISSION_RATE);
  });
});

describe("createLedgerEntry — payment-ledger path", () => {
  const baseParams: Omit<CreateLedgerEntryParams, "vendor" | "bookingDate"> = {
    bookingId: "booking-1",
    customerId: "customer-1",
    vendorId: "vendor-1",
    grossAmount: 1000,
  };

  it("defaults to standard rate when no vendor info is passed (backward-compatible, zero live effect)", async () => {
    const capture: Record<string, number | undefined> = {};
    await createLedgerEntry(fakeSupabase(capture), { ...baseParams });
    expect(capture.commission_rate).toBe(STANDARD_COMMISSION_RATE);
  });

  it("applies 0% for a founding vendor inside their waiver window", async () => {
    const capture: Record<string, number | undefined> = {};
    await createLedgerEntry(fakeSupabase(capture), {
      ...baseParams,
      vendor: { is_founding_vendor: true, founding_commission_expires_at: SIX_MONTHS_FROM_NOW.toISOString() },
      bookingDate: NOW,
    });
    expect(capture.commission_rate).toBe(0);
    expect(capture.platform_commission_amount).toBe(0);
    expect(capture.vendor_amount).toBe(1000);
  });

  it("SAFETY: charges standard commission for a founding vendor whose waiver expired yesterday", async () => {
    const capture: Record<string, number | undefined> = {};
    await createLedgerEntry(fakeSupabase(capture), {
      ...baseParams,
      vendor: { is_founding_vendor: true, founding_commission_expires_at: YESTERDAY.toISOString() },
      bookingDate: NOW,
    });
    expect(capture.commission_rate).toBe(STANDARD_COMMISSION_RATE);
    expect(capture.platform_commission_amount).toBe(1000 * STANDARD_COMMISSION_RATE);
  });
});

describe("one canonical source — calculateCommission and createLedgerEntry agree", () => {
  const scenarios: Array<{ label: string; vendor: CommissionVendorInput }> = [
    { label: "non-founding vendor", vendor: { is_founding_vendor: false, founding_commission_expires_at: null } },
    { label: "founding vendor, no expiry set", vendor: { is_founding_vendor: true, founding_commission_expires_at: null } },
    { label: "founding vendor, active waiver", vendor: { is_founding_vendor: true, founding_commission_expires_at: SIX_MONTHS_FROM_NOW.toISOString() } },
    { label: "founding vendor, expired waiver", vendor: { is_founding_vendor: true, founding_commission_expires_at: YESTERDAY.toISOString() } },
  ];

  for (const { label, vendor } of scenarios) {
    it(`${label}: calculateCommission and createLedgerEntry compute the same rate/amount for the same vendor + date`, async () => {
      const grossAmount = 1000;
      const fromCalculateCommission = calculateCommission(grossAmount, vendor, NOW);

      const capture: Record<string, number | undefined> = {};
      await createLedgerEntry(fakeSupabase(capture), {
        bookingId: "booking-consistency",
        customerId: "customer-1",
        vendorId: "vendor-1",
        grossAmount,
        vendor,
        bookingDate: NOW,
      });

      expect(capture.platform_commission_amount).toBe(fromCalculateCommission);
    });
  }
});
