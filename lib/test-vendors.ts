// Vendor IDs to exclude from all public marketplace views (browse, homepage,
// categories, regional pages, sitemap, smart matching). One-off leftover test
// records should be suspended directly in the database instead of added here
// — suspension is respected by every query automatically, including ones
// that don't know about this file (see UK_EXPANSION_READINESS_REPORT.md
// Priority 1: the smart-matching API had no test-vendor exclusion at all
// until this audit).
//
// Tinms, Mastaly, Baptist and Ballet (the previous entries here) were fully
// removed from the database on 2026-07-01 (migration 067) rather than left
// suspended — their underlying login accounts were preserved (one is the
// founder's own account, another a real contact), only the vendor business
// listings were deleted. The list is empty until a new vendor needs this
// treatment.
//
// A placeholder nil UUID is kept in the array so the generated
// `.not("id", "in", TEST_VENDOR_EXCLUSION)` clause stays valid SQL — an empty
// `IN ()` list is a Postgres syntax error, not a no-op.
export const TEST_VENDOR_IDS = [
  "00000000-0000-0000-0000-000000000000", // placeholder — keeps the IN-list non-empty
] as const;

// Supabase-formatted exclusion clause: .not("id", "in", TEST_VENDOR_EXCLUSION)
export const TEST_VENDOR_EXCLUSION = `(${TEST_VENDOR_IDS.join(",")})`;
