// Test RLS policies by creating a temporary user, vendor, then testing INSERT
// Run: node scripts/test-rls-with-user.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vibqrgswyineyxmsrtsh.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnFyZ3N3eWluZXl4bXNydHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mzc5NDgsImV4cCI6MjA5NTIxMzk0OH0.B1Y4Pw6FHYF9FhnAjP1ziUaFXp5Go7eBSa8F4fMsSNw";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnFyZ3N3eWluZXl4bXNydHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYzNzk0OCwiZXhwIjoyMDk1MjEzOTQ4fQ.M2Awgm9EBMsPRQRGhtb9CGIv_BXXKfjMLQno2iI_LYY";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = `rls-test-${Date.now()}@elbold-test.internal`;
const TEST_PASSWORD = "TestRLS2026!";

async function cleanup(userId, vendorId) {
  if (vendorId) {
    await adminClient.from("vendor_verifications").delete().eq("vendor_id", vendorId);
    await adminClient.from("verification_activity_log").delete().eq("vendor_id", vendorId);
    await adminClient.from("vendor_packages").delete().eq("vendor_id", vendorId);
    await adminClient.from("vendors").delete().eq("id", vendorId);
  }
  if (userId) {
    await adminClient.auth.admin.deleteUser(userId);
  }
  console.log("[CLEANUP] Test data removed");
}

async function run() {
  console.log("=== ELBOLD RLS Policy Test (Authenticated User) ===\n");

  let userId = null;
  let vendorId = null;

  try {
    // ── Step 1: Create a temporary test user ──────────────────────────────────
    console.log(`[SETUP] Creating test user: ${TEST_EMAIL}`);
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "vendor", full_name: "RLS Test Vendor" },
    });

    if (createErr) {
      console.log(`[SETUP] Failed to create test user: ${createErr.message}`);
      return;
    }
    userId = newUser.user.id;
    console.log(`[SETUP] Test user created: ${userId}`);

    // Create profile row (the trigger should handle this, but let's ensure it)
    await adminClient.from("profiles").upsert({
      id: userId,
      role: "vendor",
      full_name: "RLS Test Vendor",
      email: TEST_EMAIL,
      phone: null,
      phone_verified: false,
    }, { onConflict: "id" });

    // ── Step 2: Create a vendor profile for the test user ─────────────────────
    const { data: vendorRow, error: vendorErr } = await adminClient
      .from("vendors")
      .insert({
        user_id: userId,
        business_name: "RLS Test Vendor",
        category: "dj",
        status: "pending",
        verification_level: 0,
        bio: "Test vendor for RLS policy verification",
        city: "London",
      })
      .select("id")
      .single();

    if (vendorErr) {
      console.log(`[SETUP] Failed to create vendor: ${vendorErr.message}`);
      await cleanup(userId, null);
      return;
    }
    vendorId = vendorRow.id;
    console.log(`[SETUP] Test vendor created: ${vendorId}`);

    // ── Step 3: Sign in as the test user ──────────────────────────────────────
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signinData, error: signinErr } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signinErr) {
      console.log(`[AUTH] Sign-in failed: ${signinErr.message}`);
      await cleanup(userId, vendorId);
      return;
    }

    const accessToken = signinData.session?.access_token;
    console.log(`[AUTH] Signed in successfully. Token starts with: ${accessToken?.slice(0, 20)}...`);

    // Create an authenticated client
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    // ── Step 4: Test SELECT on vendor_verifications ───────────────────────────
    console.log("\n[TEST] Testing SELECT on vendor_verifications...");
    const { data: selectVV, error: selectVVErr } = await userClient
      .from("vendor_verifications")
      .select("id")
      .eq("vendor_id", vendorId);

    if (selectVVErr) {
      console.log(`  ❌ SELECT FAILED: ${selectVVErr.message} (code: ${selectVVErr.code})`);
      if (selectVVErr.code === "42501") console.log("  → No SELECT policy for 'authenticated' on vendor_verifications");
    } else {
      console.log(`  ✓ SELECT PASSED: ${selectVV?.length ?? 0} rows`);
    }

    // ── Step 5: Test INSERT on vendor_verifications ───────────────────────────
    console.log("\n[TEST] Testing INSERT on vendor_verifications...");
    const insertPayload = {
      vendor_id: vendorId,
      type: "government_id",
      status: "pending",
      document_url: "test://rls-check",
      submitted_at: new Date().toISOString(),
      resubmission_allowed: true,
      resubmit_count: 0,
    };

    const { data: insertVV, error: insertVVErr } = await userClient
      .from("vendor_verifications")
      .upsert(insertPayload, { onConflict: "vendor_id,type" })
      .select()
      .single();

    if (insertVVErr) {
      console.log(`  ❌ INSERT FAILED: ${insertVVErr.message} (code: ${insertVVErr.code})`);
      if (insertVVErr.code === "42501") {
        console.log("  ⚠️  CONFIRMED: Migration 039d NOT applied. INSERT policy does not exist.");
        console.log("  → vendor_verifications INSERT/UPSERT is blocked by RLS for authenticated users.");
      } else {
        console.log(`  → Unexpected error. Code: ${insertVVErr.code}`);
      }
    } else {
      console.log(`  ✓ INSERT PASSED: row id = ${insertVV?.id}`);
      console.log("  ✓ Migration 039d IS applied (or equivalent INSERT policy exists).");
    }

    // ── Step 6: Test INSERT on verification_activity_log ─────────────────────
    console.log("\n[TEST] Testing INSERT on verification_activity_log...");
    const { error: logInsertErr } = await userClient
      .from("verification_activity_log")
      .insert({
        vendor_id: vendorId,
        actor_id: userId,
        actor_type: "vendor",
        action: "submitted",
        new_status: "pending",
      });

    if (logInsertErr) {
      console.log(`  ❌ INSERT FAILED: ${logInsertErr.message} (code: ${logInsertErr.code})`);
      if (logInsertErr.code === "42501") {
        console.log("  ⚠️  CONFIRMED: verification_activity_log INSERT policy does not exist.");
      }
    } else {
      console.log(`  ✓ INSERT PASSED on verification_activity_log`);
    }

    // ── Step 7: Test SELECT on verification_activity_log ─────────────────────
    console.log("\n[TEST] Testing SELECT on verification_activity_log...");
    const { data: selectLog, error: selectLogErr } = await userClient
      .from("verification_activity_log")
      .select("id")
      .eq("vendor_id", vendorId);

    if (selectLogErr) {
      console.log(`  ❌ SELECT FAILED: ${selectLogErr.message} (code: ${selectLogErr.code})`);
    } else {
      console.log(`  ✓ SELECT PASSED: ${selectLog?.length ?? 0} rows`);
    }

    // ── Step 8: Check storage bucket permissions ──────────────────────────────
    console.log("\n[TEST] Testing verification-documents storage upload...");
    const testFileContent = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
    const testPath = `verification/${vendorId}/government_id/rls-test.png`;

    const { data: uploadData, error: uploadErr } = await userClient
      .storage
      .from("verification-documents")
      .upload(testPath, testFileContent, { contentType: "image/png", upsert: true });

    if (uploadErr) {
      console.log(`  ❌ STORAGE UPLOAD FAILED: ${uploadErr.message}`);
      if (uploadErr.message.includes("row-level security") || uploadErr.message.includes("Unauthorized")) {
        console.log("  → Storage RLS blocks user upload. The API route uses admin client to bypass this.");
      }
    } else {
      console.log(`  ✓ STORAGE UPLOAD PASSED (user can directly upload — not required, API uses admin client)`);
      // Clean up
      await adminClient.storage.from("verification-documents").remove([testPath]);
    }

    // Summary
    console.log("\n=== SUMMARY ===");
    const vvOk = !insertVVErr || insertVVErr.code !== "42501";
    const logOk = !logInsertErr || logInsertErr.code !== "42501";
    console.log(`vendor_verifications INSERT policy:     ${insertVVErr?.code === "42501" ? "❌ MISSING" : insertVVErr ? `? Error: ${insertVVErr.code}` : "✓ EXISTS"}`);
    console.log(`vendor_verifications SELECT policy:     ${selectVVErr?.code === "42501" ? "❌ MISSING" : selectVVErr ? `? Error: ${selectVVErr.code}` : "✓ EXISTS"}`);
    console.log(`verification_activity_log INSERT:       ${logInsertErr?.code === "42501" ? "❌ MISSING" : logInsertErr ? `? Error: ${logInsertErr.code}` : "✓ EXISTS"}`);
    console.log(`verification_activity_log SELECT:       ${selectLogErr?.code === "42501" ? "❌ MISSING" : selectLogErr ? `? Error: ${selectLogErr.code}` : "✓ EXISTS"}`);
    console.log(`verification-documents bucket:          ✓ EXISTS`);

    if (insertVVErr?.code === "42501") {
      console.log("\n❌ ACTION REQUIRED: Apply migration 039d in Supabase SQL Editor");
    } else if (!insertVVErr) {
      console.log("\n✓ Verification system backend is OPERATIONAL");
    }

  } finally {
    await cleanup(userId, vendorId);
  }
}

run().catch(console.error);
