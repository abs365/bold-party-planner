// Human testing accounts — excluded from all public marketplace views.
// Do NOT delete these vendors; they contain valid test data for QA.
export const TEST_VENDOR_IDS = [
  "ce87d98d-e334-4427-98be-a1e58a13e18b", // Tinms
  "db6756f2-4417-4813-a0fd-1cf5b2bc6e2b", // Mastaly
  "cfe5733a-805e-4a90-a5f0-b0d8d3185d9d", // Baptist
  "07574580-0a35-4a1b-a3fc-d17b86cd3a21", // Ballet
] as const;

// Supabase-formatted exclusion clause: .not("id", "in", TEST_VENDOR_EXCLUSION)
export const TEST_VENDOR_EXCLUSION = `(${TEST_VENDOR_IDS.join(",")})`;
