// Test: Does vendor_verifications INSERT policy exist?
// Run: node scripts/test-verification-rls.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vibqrgswyineyxmsrtsh.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnFyZ3N3eWluZXl4bXNydHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mzc5NDgsImV4cCI6MjA5NTIxMzk0OH0.B1Y4Pw6FHYF9FhnAjP1ziUaFXp5Go7eBSa8F4fMsSNw";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnFyZ3N3eWluZXl4bXNydHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYzNzk0OCwiZXhwIjoyMDk1MjEzOTQ4fQ.M2Awgm9EBMsPRQRGhtb9CGIv_BXXKfjMLQno2iI_LYY";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("=== ELBOLD Verification RLS Test ===\n");

  // ── Step 1: Count rows in vendor_verifications (service role bypasses RLS) ──
  const { count: vvCount } = await adminClient
    .from("vendor_verifications")
    .select("*", { count: "exact", head: true });
  console.log(`[DB] vendor_verifications row count: ${vvCount}`);

  // ── Step 2: Count rows in verification_activity_log ──
  const { count: valCount } = await adminClient
    .from("verification_activity_log")
    .select("*", { count: "exact", head: true });
  console.log(`[DB] verification_activity_log row count: ${valCount}`);

  // ── Step 3: Check storage bucket exists ──
  const { data: buckets, error: bucketsErr } = await adminClient
    .storage.listBuckets();
  if (bucketsErr) {
    console.log(`[STORAGE] Error listing buckets: ${bucketsErr.message}`);
  } else {
    const names = (buckets || []).map(b => b.name);
    console.log(`[STORAGE] Buckets: ${names.join(", ")}`);
    const hasVerifBucket = names.includes("verification-documents");
    console.log(`[STORAGE] verification-documents bucket: ${hasVerifBucket ? "EXISTS" : "MISSING"}`);
  }

  // ── Step 4: Find a real vendor to test with ──
  const { data: vendors, error: vendorErr } = await adminClient
    .from("vendors")
    .select("id, user_id, status, business_name, category, verification_level")
    .eq("status", "approved")
    .limit(3);

  if (vendorErr) {
    console.log(`[DB] Error fetching vendors: ${vendorErr.message}`);
    return;
  }
  console.log(`\n[DB] Approved vendors found: ${vendors?.length ?? 0}`);
  vendors?.forEach(v => {
    console.log(`  - ${v.business_name} (cat: ${v.category}, level: ${v.verification_level}, id: ${v.id})`);
  });

  if (!vendors || vendors.length === 0) {
    console.log("[TEST] No approved vendors to test with — checking pending vendors");
    const { data: pendingVendors } = await adminClient
      .from("vendors")
      .select("id, user_id, status, business_name, category")
      .limit(3);
    console.log(`[DB] All vendors: ${JSON.stringify(pendingVendors)}`);
    return;
  }

  // ── Step 5: Get user JWT for the vendor ──
  const testVendor = vendors[0];
  console.log(`\n[TEST] Using vendor: ${testVendor.business_name} (user_id: ${testVendor.user_id})`);

  // Use service role to generate a user-level session for RLS testing
  // We sign in via email lookup
  const { data: profileData } = await adminClient
    .from("profiles")
    .select("id, email:id")
    .eq("id", testVendor.user_id)
    .single();

  // Get user from auth admin API
  const { data: { user: authUser }, error: authErr } = await adminClient.auth.admin.getUserById(testVendor.user_id);
  if (authErr || !authUser) {
    console.log(`[AUTH] Cannot fetch user: ${authErr?.message}`);
    return;
  }
  console.log(`[AUTH] Found user: ${authUser.email}`);

  // ── Step 6: Create user-scoped client via impersonation ──
  // Generate a short-lived JWT for this user
  const { data: tokenData, error: tokenErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.email ?? "",
    options: {
      redirectTo: "https://www.elbold.com",
    },
  });

  // Alternative: use createUserClient approach
  // Instead, let's directly test INSERT using service role but with authenticated context
  // This simulates what happens when the vendor submits

  // ── Step 7: Try INSERT into vendor_verifications using service role ──
  // (This bypasses RLS — so this ALWAYS succeeds with service role)
  // We need to test with the actual authenticated role

  // Create a fake JWT to test RLS via direct auth
  // Use the user's email to sign in
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try demo vendor login
  const demoEmails = [
    { email: "vendor1@elbold.demo", password: "ElboldDemo2026!" },
    { email: "vendor2@elbold.demo", password: "ElboldDemo2026!" },
    { email: "vendor3@elbold.demo", password: "ElboldDemo2026!" },
  ];

  let userClient = null;
  let signedInVendorId = null;

  for (const creds of demoEmails) {
    const { data: signinData, error: signinErr } = await anonClient.auth.signInWithPassword(creds);
    if (!signinErr && signinData.session) {
      console.log(`\n[AUTH] Signed in as ${creds.email}`);
      userClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${signinData.session.access_token}` },
        },
      });

      // Find vendor for this user
      const { data: uVendor } = await adminClient
        .from("vendors")
        .select("id")
        .eq("user_id", signinData.user.id)
        .maybeSingle();

      signedInVendorId = uVendor?.id ?? null;
      console.log(`[AUTH] Vendor ID for this user: ${signedInVendorId ?? "NONE"}`);
      break;
    }
  }

  if (!userClient || !signedInVendorId) {
    console.log("\n[AUTH] Could not sign in as any demo vendor.");
    console.log("[TEST] Falling back to raw policy check via service role INSERT test...");

    // As a last resort — try INSERT using anon role to see the RLS error message
    const testVendorId = vendors[0].id;
    const { data: insertData, error: insertErr } = await anonClient
      .from("vendor_verifications")
      .insert({
        vendor_id: testVendorId,
        type: "government_id",
        status: "pending",
        document_url: "test",
        submitted_at: new Date().toISOString(),
        resubmission_allowed: true,
        resubmit_count: 0,
      })
      .select()
      .single();

    if (insertErr) {
      console.log(`[RLS TEST - anon] INSERT error: ${insertErr.message} (code: ${insertErr.code})`);
      console.log("  → This is expected (anon role should not be allowed)");
    }

    console.log("\n[CONCLUSION] Cannot directly test authenticated INSERT without demo user credentials.");
    console.log("[ACTION NEEDED] Apply migration 039d to production database via Supabase SQL Editor.");
    return;
  }

  // ── Step 8: Test SELECT on vendor_verifications as authenticated vendor ──
  const { data: selectData, error: selectErr } = await userClient
    .from("vendor_verifications")
    .select("*")
    .eq("vendor_id", signedInVendorId);

  if (selectErr) {
    console.log(`\n[RLS TEST] SELECT failed: ${selectErr.message} (code: ${selectErr.code})`);
    if (selectErr.code === "42501" || selectErr.message.includes("row-level security")) {
      console.log("  → No SELECT policy for authenticated role on vendor_verifications");
    }
  } else {
    console.log(`\n[RLS TEST] SELECT succeeded: ${selectData?.length ?? 0} rows`);
  }

  // ── Step 9: Test INSERT on vendor_verifications as authenticated vendor ──
  const testRow = {
    vendor_id: signedInVendorId,
    type: "government_id",
    status: "pending",
    document_url: "test_rls_check_" + Date.now(),
    submitted_at: new Date().toISOString(),
    resubmission_allowed: true,
    resubmit_count: 0,
  };

  const { data: insertData, error: insertErr } = await userClient
    .from("vendor_verifications")
    .upsert(testRow, { onConflict: "vendor_id,type" })
    .select()
    .single();

  if (insertErr) {
    console.log(`\n[RLS TEST] INSERT/UPSERT failed: ${insertErr.message} (code: ${insertErr.code})`);
    if (insertErr.code === "42501" || insertErr.message.includes("row-level security")) {
      console.log("  ❌ CONFIRMED: Migration 039d NOT applied. INSERT policy missing.");
    } else if (insertErr.code === "23505") {
      console.log("  ✓ INSERT was attempted — unique constraint hit (policy exists, row already present)");
    } else {
      console.log(`  → Unexpected error. May be schema issue.`);
    }
  } else {
    console.log(`\n[RLS TEST] INSERT/UPSERT SUCCEEDED: ${JSON.stringify(insertData)}`);
    console.log("  ✓ Migration 039d IS applied. INSERT policy works.");

    // Clean up test row
    await adminClient
      .from("vendor_verifications")
      .delete()
      .eq("id", insertData.id);
    console.log("  → Test row cleaned up");

    // Test activity_log INSERT
    const { error: logErr } = await userClient
      .from("verification_activity_log")
      .insert({
        vendor_id: signedInVendorId,
        actor_id: null,
        actor_type: "vendor",
        action: "submitted",
        new_status: "pending",
      });

    if (logErr) {
      console.log(`\n[RLS TEST] verification_activity_log INSERT failed: ${logErr.message}`);
    } else {
      console.log(`\n[RLS TEST] verification_activity_log INSERT succeeded`);
      // Clean up
      await adminClient
        .from("verification_activity_log")
        .delete()
        .eq("vendor_id", signedInVendorId)
        .eq("action", "submitted")
        .eq("new_status", "pending");
    }
  }

  // ── Step 10: Check vendors to confirm test vendor state ──
  const { data: finalState } = await adminClient
    .from("vendors")
    .select("id, business_name, verification_level, status")
    .eq("id", signedInVendorId)
    .single();
  console.log(`\n[STATE] Vendor final state: ${JSON.stringify(finalState)}`);
}

run().catch(console.error);
