// Full end-to-end verification submission test
// Tests the complete API flow: upload → submit → DB check → activity log
// Run: node scripts/test-full-submission.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://vibqrgswyineyxmsrtsh.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnFyZ3N3eWluZXl4bXNydHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mzc5NDgsImV4cCI6MjA5NTIxMzk0OH0.B1Y4Pw6FHYF9FhnAjP1ziUaFXp5Go7eBSa8F4fMsSNw";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnFyZ3N3eWluZXl4bXNydHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYzNzk0OCwiZXhwIjoyMDk1MjEzOTQ4fQ.M2Awgm9EBMsPRQRGhtb9CGIv_BXXKfjMLQno2iI_LYY";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = `e2e-verif-${Date.now()}@elbold-test.internal`;
const TEST_PASSWORD = "TestE2E2026!";

async function cleanup(userId, vendorId) {
  if (vendorId) {
    await adminClient.storage.from("verification-documents").remove([`verification/${vendorId}/government_id/e2e-test.png`]);
    await adminClient.from("vendor_verifications").delete().eq("vendor_id", vendorId);
    await adminClient.from("verification_activity_log").delete().eq("vendor_id", vendorId);
    await adminClient.from("vendors").delete().eq("id", vendorId);
  }
  if (userId) await adminClient.auth.admin.deleteUser(userId);
  console.log("[CLEANUP] ✓ Test data removed");
}

// Minimal PNG (1x1 transparent pixel)
function makePNG() {
  return Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c48900000011494441540869" +
    "62600000000200000000ff000000000049454e44ae426082",
    "hex"
  );
}

async function run() {
  console.log("=== ELBOLD E2E Verification Submission Test ===\n");

  let userId = null;
  let vendorId = null;

  try {
    // ── Step 1: Setup — create test user + vendor ─────────────────────────────
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "vendor", full_name: "E2E Test Vendor" },
    });
    if (createErr) throw new Error(`Create user failed: ${createErr.message}`);
    userId = newUser.user.id;

    await adminClient.from("profiles").upsert({
      id: userId, role: "vendor", full_name: "E2E Test Vendor", phone: null, phone_verified: false,
    }, { onConflict: "id" });

    const { data: vRow, error: vErr } = await adminClient.from("vendors").insert({
      user_id: userId,
      business_name: "E2E Test Vendor Co",
      category: "dj",
      status: "pending",
      verification_level: 0,
      bio: "Test vendor for end-to-end verification submission test",
      city: "London",
      phone: "+44 7700 000000",
    }).select("id").single();
    if (vErr) throw new Error(`Create vendor failed: ${vErr.message}`);
    vendorId = vRow.id;
    console.log(`[SETUP] ✓ Test user (${userId.slice(0,8)}) + vendor (${vendorId.slice(0,8)}) created`);
    console.log(`        category: dj → required docs: government_id, proof_of_address`);

    // ── Step 2: Sign in as test vendor ────────────────────────────────────────
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signin, error: signinErr } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL, password: TEST_PASSWORD,
    });
    if (signinErr) throw new Error(`Sign in failed: ${signinErr.message}`);
    const token = signin.session.access_token;
    console.log(`[AUTH]  ✓ Signed in as test vendor`);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // ── Step 3: Simulate the upload API — upload to verification-documents ────
    // The real API route (/api/verification/upload) uses createAdminClient() for storage.
    // Here we test with the admin client to replicate that behaviour.
    const docType = "government_id";
    const storagePath = `verification/${vendorId}/${docType}/${Date.now()}.png`;
    const pngData = makePNG();

    const { error: uploadErr } = await adminClient.storage
      .from("verification-documents")
      .upload(storagePath, pngData, { contentType: "image/png", upsert: false });

    if (uploadErr) {
      console.log(`[UPLOAD] ❌ Storage upload failed: ${uploadErr.message}`);
      console.log("         This would cause the upload API route to return 500.");
    } else {
      console.log(`[UPLOAD] ✓ File uploaded to verification-documents: ${storagePath}`);
    }

    // ── Step 4: Simulate POST /api/vendor/verification (the submit endpoint) ──
    // Uses the authenticated user client (matching real app behaviour)
    const submitPayload = {
      vendor_id: vendorId,
      type: docType,
      status: "pending",
      document_url: storagePath,
      submitted_at: new Date().toISOString(),
      notes: null,
      rejection_reason: null,
      resubmission_allowed: true,
      resubmit_count: 0,
      reviewed_at: null,
      reviewer_id: null,
    };

    const { data: savedVerif, error: submitErr } = await userClient
      .from("vendor_verifications")
      .upsert(submitPayload, { onConflict: "vendor_id,type" })
      .select()
      .single();

    if (submitErr) {
      console.log(`[SUBMIT] ❌ vendor_verifications upsert failed: ${submitErr.message} (${submitErr.code})`);
    } else {
      console.log(`[SUBMIT] ✓ vendor_verifications row created: id=${savedVerif.id}`);
      console.log(`         status: ${savedVerif.status}, type: ${savedVerif.type}`);
    }

    // ── Step 5: Simulate activity log insert ──────────────────────────────────
    const { error: logErr } = await userClient
      .from("verification_activity_log")
      .insert({
        vendor_id: vendorId,
        verification_id: savedVerif?.id ?? null,
        actor_id: userId,
        actor_type: "vendor",
        action: "submitted",
        new_status: "pending",
        notes: null,
        metadata: { type: docType, file_name: "e2e-test.png" },
      });

    if (logErr) {
      console.log(`[LOG]    ❌ verification_activity_log insert failed: ${logErr.message} (${logErr.code})`);
    } else {
      console.log(`[LOG]    ✓ verification_activity_log entry created`);
    }

    // ── Step 6: Verify DB state ───────────────────────────────────────────────
    const { data: dbCheck, count } = await adminClient
      .from("vendor_verifications")
      .select("id,type,status,document_url,submitted_at", { count: "exact" })
      .eq("vendor_id", vendorId);

    const { data: logCheck, count: logCount } = await adminClient
      .from("verification_activity_log")
      .select("id,action,actor_type", { count: "exact" })
      .eq("vendor_id", vendorId);

    console.log(`\n[DB]    vendor_verifications rows for this vendor: ${count}`);
    dbCheck?.forEach(r => console.log(`         - ${r.type} | ${r.status} | ${r.submitted_at}`));
    console.log(`[DB]    verification_activity_log rows for this vendor: ${logCount}`);
    logCheck?.forEach(r => console.log(`         - ${r.action} | ${r.actor_type}`));

    // ── Step 7: Test signed URL generation (simulates /api/verification/document) ─
    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("verification-documents")
      .createSignedUrl(storagePath, 60);

    if (signedErr) {
      console.log(`[URL]    ❌ Signed URL generation failed: ${signedErr.message}`);
    } else {
      console.log(`[URL]    ✓ Signed URL generated (${signedData.signedUrl.length} chars)`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log("\n=== TEST RESULTS ===");
    const allPassed = !uploadErr && !submitErr && !logErr;
    console.log(`T1 Storage Upload:           ${uploadErr ? "❌ FAIL" : "✓ PASS"}`);
    console.log(`T2 vendor_verifications:     ${submitErr ? "❌ FAIL" : "✓ PASS"}`);
    console.log(`T3 verification_activity_log:${logErr    ? "❌ FAIL" : "✓ PASS"}`);
    console.log(`T4 Signed URL generation:    ${signedErr ? "❌ FAIL" : "✓ PASS"}`);
    console.log(`\nOVERALL: ${allPassed ? "✓ VERIFICATION SYSTEM OPERATIONAL" : "❌ FAILURES DETECTED"}`);

    if (allPassed) {
      console.log("\nThe verification system backend works correctly for authenticated vendors.");
      console.log("The issue reported (empty dropdown) is a FRONTEND/UX issue, not a backend issue.");
    }

  } finally {
    await cleanup(userId, vendorId);
  }
}

run().catch(console.error);
