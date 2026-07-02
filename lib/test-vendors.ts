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

// ── is_test_data (migration 072) ─────────────────────────────────────────
//
// This is the durable, forward-looking replacement for the hardcoded ID
// list above. Migrations 067 and 071 both had to hunt down and manually
// delete test/demo data found live in production after the fact - a real
// `vendors.is_test_data` / `profiles.is_test_data` column now exists so any
// future test/QA/smoke-test record can be marked at creation time instead
// of requiring another cleanup migration later.
//
// ANY code path that creates a vendor or profile purely for testing,
// QA, or demo purposes MUST set is_test_data = true. ANY query used for a
// production dashboard, marketplace listing, or commercial/KPI report MUST
// exclude is_test_data = true rows - apply `withoutTestData()` below, or the
// equivalent `.eq("is_test_data", false)` filter directly.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts any Supabase query builder (vendors or profiles); typed `any` deliberately, since Supabase's generic builder types cause "type instantiation excessively deep" errors when threaded through a wrapper function like this
export function withoutTestData(query: any): any {
  return query.eq("is_test_data", false);
}
