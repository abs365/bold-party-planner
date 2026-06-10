/**
 * Revenue Finalisation — Production Validation Script
 *
 * Run this script in two stages:
 *
 *   Stage 1 — Create test booking + checkout URL:
 *     node scripts/validate-revenue-final.mjs stage1
 *
 *   Stage 2 — Check webhook + cancel + verify refund:
 *     node scripts/validate-revenue-final.mjs stage2 <booking_id>
 *
 * Prerequisites:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   or exported as environment variables.
 *
 * The script uses the Supabase service role key for all DB reads/writes
 * and calls the production ELBOLD API for the cancel flow (real auth).
 */

import https from "https";
import { readFileSync } from "fs";

// ── Load env ────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch { /* no .env.local — rely on existing env */ }
}
loadEnv();

const SUPABASE_URL   = process.env.SUPABASE_URL   || "https://vibqrgswyineyxmsrtsh.supabase.co";
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROD_URL       = "https://www.elbold.com";
const TEST_CUSTOMER_EMAIL = "testcustomer.revval@elbold.demo"; // will be overridden by lookup
const TEST_CUSTOMER_PASSWORD = "TestRevVal2026!";

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

// ── Supabase REST helper ────────────────────────────────────────────────────
function supabase(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + "/rest/v1/" + path);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) url.searchParams.set(k, v);
    }
    const body = opts.body ? JSON.stringify(opts.body) : undefined;
    const req = https.request(url, {
      method: opts.method || "GET",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": opts.prefer || (opts.method === "POST" ? "return=representation" : "return=minimal"),
        ...(opts.headers || {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Supabase Auth REST helper ────────────────────────────────────────────────
function supabaseAuth(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + "/auth/v1/" + path);
    const bodyStr = JSON.stringify(body);
    const req = https.request(url, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── Production API helper ────────────────────────────────────────────────────
function prodApi(path, opts = {}, cookie = "") {
  return new Promise((resolve, reject) => {
    const url = new URL(PROD_URL + path);
    const body = opts.body ? JSON.stringify(opts.body) : undefined;
    const req = https.request(url, {
      method: opts.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie,
        ...(opts.headers || {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, data, headers: res.headers }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Build SSR cookie ────────────────────────────────────────────────────────
function buildSsrCookie(session) {
  const cookieObj = {
    access_token: session.access_token,
    token_type: session.token_type || "bearer",
    expires_in: session.expires_in || 3600,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    refresh_token: session.refresh_token,
    user: session.user,
  };
  const b64 = Buffer.from(JSON.stringify(cookieObj)).toString("base64url");
  const value = "base64-" + b64;
  const cookieName = `sb-vibqrgswyineyxmsrtsh-auth-token`;
  const MAX = 3180;
  if (value.length <= MAX) return `${cookieName}=${value}`;
  const chunks = [];
  for (let i = 0, idx = 0; i < value.length; i += MAX, idx++) {
    chunks.push(`${cookieName}.${idx}=${value.slice(i, i + MAX)}`);
  }
  return chunks.join("; ");
}

// ── Stage 1: Create test booking + checkout session ──────────────────────────
async function stage1() {
  console.log("\n=== STAGE 1: Create test booking + checkout session ===\n");

  // 1a. Find the test customer user
  console.log("1. Looking up test customer...");
  const customersRes = await supabase("profiles?role=eq.customer&limit=20");
  const profiles = customersRes.data || [];

  // Find the user created for previous validation (has known password)
  let testCustomer = null;
  for (const p of profiles) {
    const authRes = await supabaseAuth("token?grant_type=password", {
      email: p.email,
      password: TEST_CUSTOMER_PASSWORD,
    });
    if (authRes.status === 200 && authRes.data?.access_token) {
      testCustomer = { profile: p, session: authRes.data };
      console.log(`   Found test customer: ${p.email} (id: ${p.id})`);
      break;
    }
  }

  if (!testCustomer) {
    console.error("   No customer with password TestRevVal2026! found.");
    console.error("   Create one via Supabase Dashboard or reset an existing customer's password.");
    process.exit(1);
  }

  // 1b. Find a vendor with a package
  console.log("2. Looking up test vendor with a package...");
  const vendorRes = await supabase("vendor_packages?select=id,price,deposit_amount,vendor_id,vendors(id,user_id)&limit=5&order=created_at.asc");
  const packages = vendorRes.data || [];
  if (!packages.length) {
    console.error("   No vendor packages found. Create at least one vendor with a package.");
    process.exit(1);
  }
  const pkg = packages[0];
  const vendorId = pkg.vendor_id || pkg.vendors?.id;
  console.log(`   Using package id=${pkg.id}, price=${pkg.price}, vendor_id=${vendorId}`);

  // 1c. Create a test event
  console.log("3. Creating test event...");
  const eventRes = await supabase("events", {
    method: "POST",
    prefer: "return=representation",
    body: {
      customer_id: testCustomer.profile.id,
      title: "RevVal Test Event " + Date.now(),
      event_type: "birthday",
      event_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      location: "Test Location, Essex",
      guest_count: 10,
      budget: 100,
      status: "active",
    },
  });
  if (eventRes.status !== 201 || !eventRes.data?.[0]?.id) {
    console.error("   Failed to create event:", eventRes.status, JSON.stringify(eventRes.data));
    process.exit(1);
  }
  const event = eventRes.data[0];
  console.log(`   Event created: ${event.id}`);

  // 1d. Create booking directly (simulate quote accepted)
  console.log("4. Creating booking (status=pending_payment)...");
  const bookingRes = await supabase("bookings", {
    method: "POST",
    prefer: "return=representation",
    body: {
      customer_id: testCustomer.profile.id,
      vendor_id: vendorId,
      event_id: event.id,
      package_id: pkg.id,
      total_amount: 1.00,
      deposit_amount: 1.00,
      status: "pending_payment",
      payment_status: "pending",
      notes: "RevVal automated test booking",
    },
  });
  if (bookingRes.status !== 201 || !bookingRes.data?.[0]?.id) {
    console.error("   Failed to create booking:", bookingRes.status, JSON.stringify(bookingRes.data));
    process.exit(1);
  }
  const booking = bookingRes.data[0];
  console.log(`   Booking created: ${booking.id}`);

  // 1e. Generate Stripe checkout session via production API
  console.log("5. Generating Stripe checkout session via production API...");
  const cookie = buildSsrCookie(testCustomer.session);
  const checkoutRes = await prodApi("/api/payments/checkout", {
    method: "POST",
    body: { bookingId: booking.id, paymentType: "deposit" },
  }, cookie);

  if (checkoutRes.status !== 200 || !checkoutRes.data?.url) {
    console.error("   Checkout session failed:", checkoutRes.status, JSON.stringify(checkoutRes.data));
    console.error("   This may indicate an issue with the Stripe key or checkout route.");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("CHECKOUT URL (pay GBP 1.00 in browser):");
  console.log(checkoutRes.data.url);
  console.log("=".repeat(60));
  console.log("\nBooking ID for Stage 2:");
  console.log(booking.id);
  console.log("\nNext step:");
  console.log("  1. Open the checkout URL in your browser");
  console.log("  2. Pay GBP 1.00 using card 4242 4242 4242 4242");
  console.log("  3. Wait ~10 seconds for webhook to process");
  console.log("  4. Run: node scripts/validate-revenue-final.mjs stage2 " + booking.id);
  console.log("=".repeat(60) + "\n");
}

// ── Stage 2: Verify payment + cancel + verify refund ────────────────────────
async function stage2(bookingId) {
  console.log("\n=== STAGE 2: Verify payment → cancel → verify refund ===\n");
  console.log(`Booking ID: ${bookingId}\n`);

  const pass = [];
  const fail = [];

  // 2a. Check booking state after webhook
  console.log("--- CHECK 1: Booking state after webhook ---");
  const bookingRes = await supabase(`bookings?id=eq.${bookingId}&select=*`);
  const booking = bookingRes.data?.[0];
  if (!booking) {
    console.error("   Booking not found");
    process.exit(1);
  }
  console.log(`   status:         ${booking.status}`);
  console.log(`   payment_status: ${booking.payment_status}`);
  console.log(`   confirmed_at:   ${booking.confirmed_at}`);

  if (booking.status === "confirmed") {
    pass.push("C1: booking.status = confirmed");
  } else {
    fail.push(`C1: booking.status = ${booking.status} (expected confirmed)`);
  }
  if (booking.payment_status === "deposit_paid") {
    pass.push("C2: booking.payment_status = deposit_paid");
  } else {
    fail.push(`C2: booking.payment_status = ${booking.payment_status} (expected deposit_paid)`);
  }
  if (booking.confirmed_at) {
    pass.push(`C3: confirmed_at set (${booking.confirmed_at})`);
  } else {
    fail.push("C3: confirmed_at is null (BUG-003 not working)");
  }

  // 2b. Check payments table
  console.log("\n--- CHECK 2: Payment record ---");
  const paymentRes = await supabase(`payments?booking_id=eq.${bookingId}&select=*`);
  const payment = paymentRes.data?.[0];
  if (payment) {
    console.log(`   stripe_payment_intent_id: ${payment.stripe_payment_intent_id}`);
    console.log(`   amount:  ${payment.amount}`);
    console.log(`   status:  ${payment.status}`);
    if (payment.status === "succeeded") {
      pass.push("C4: payments row with status=succeeded");
    } else {
      fail.push(`C4: payments status=${payment.status} (expected succeeded)`);
    }
  } else {
    fail.push("C4: no payments row found (webhook may not have fired)");
    console.error("   No payment row found. Check Stripe webhook is registered.");
    console.error("   Aborting — cannot cancel unpaid booking.");
    printSummary(pass, fail);
    process.exit(1);
  }

  // 2c. Check ledger
  console.log("\n--- CHECK 3: Financial ledger ---");
  const ledgerRes = await supabase(`financial_ledger?booking_id=eq.${bookingId}&select=*`);
  const ledger = ledgerRes.data?.[0];
  if (ledger) {
    console.log(`   gross_amount:  ${ledger.gross_amount}`);
    console.log(`   commission:    ${ledger.platform_commission_amount}`);
    console.log(`   vendor_amount: ${ledger.vendor_amount}`);
    console.log(`   payment_status: ${ledger.payment_status}`);
    pass.push("C5: financial_ledger row exists");
    if (ledger.payment_status === "paid") pass.push("C6: ledger.payment_status = paid");
    else fail.push(`C6: ledger.payment_status = ${ledger.payment_status}`);
  } else {
    fail.push("C5: financial_ledger row missing");
    fail.push("C6: (no ledger row)");
  }

  // 2d. Authenticate as customer + cancel booking
  console.log("\n--- CHECK 4: Cancel booking (customer auth) ---");

  // Sign in as test customer (find by booking customer_id)
  const custProfileRes = await supabase(`profiles?id=eq.${booking.customer_id}&select=*`);
  const custProfile = custProfileRes.data?.[0];
  console.log(`   Signing in as customer: ${custProfile?.email}`);

  const signInRes = await supabaseAuth("token?grant_type=password", {
    email: custProfile?.email,
    password: TEST_CUSTOMER_PASSWORD,
  });
  if (signInRes.status !== 200 || !signInRes.data?.access_token) {
    fail.push("C7: customer sign-in failed — cannot test cancel");
    console.error("   Customer sign-in failed:", signInRes.status, JSON.stringify(signInRes.data));
    printSummary(pass, fail);
    process.exit(1);
  }
  const cookie = buildSsrCookie(signInRes.data);

  console.log("   Sending cancel PATCH request...");
  const t0 = Date.now();
  const cancelRes = await prodApi(`/api/bookings/${bookingId}`, {
    method: "PATCH",
    body: { status: "cancelled" },
  }, cookie);
  const elapsed = Date.now() - t0;
  console.log(`   Response: HTTP ${cancelRes.status} in ${elapsed}ms`);

  if (cancelRes.status === 200) {
    pass.push(`C7: cancel API returned 200 in ${elapsed}ms`);
    if (elapsed > 1000) {
      pass.push(`C8: response time ${elapsed}ms confirms Stripe await is working (>1s)`);
    } else {
      fail.push(`C8: response time ${elapsed}ms is suspiciously fast — Stripe await may not be blocking`);
    }
  } else {
    fail.push(`C7: cancel API returned ${cancelRes.status}`);
    fail.push("C8: (cancel failed)");
    console.error("   Cancel response:", JSON.stringify(cancelRes.data));
  }

  // Wait 2 seconds for DB to settle
  await new Promise((r) => setTimeout(r, 2000));

  // 2e. Check post-cancel booking state
  console.log("\n--- CHECK 5: Post-cancel booking state ---");
  const cancelledBookingRes = await supabase(`bookings?id=eq.${bookingId}&select=*`);
  const cancelledBooking = cancelledBookingRes.data?.[0];
  console.log(`   status:         ${cancelledBooking?.status}`);
  console.log(`   payment_status: ${cancelledBooking?.payment_status}`);
  console.log(`   cancelled_at:   ${cancelledBooking?.cancelled_at}`);

  if (cancelledBooking?.status === "cancelled") pass.push("C9: booking.status = cancelled");
  else fail.push(`C9: booking.status = ${cancelledBooking?.status}`);

  if (cancelledBooking?.payment_status === "refunded") {
    pass.push("C10: booking.payment_status = refunded");
  } else {
    fail.push(`C10: booking.payment_status = ${cancelledBooking?.payment_status} (expected refunded)`);
  }

  // 2f. Check ledger post-cancel
  console.log("\n--- CHECK 6: Ledger post-cancel ---");
  const ledgerPostRes = await supabase(`financial_ledger?booking_id=eq.${bookingId}&select=*`);
  const ledgerPost = ledgerPostRes.data?.[0];
  console.log(`   payment_status: ${ledgerPost?.payment_status}`);
  console.log(`   refund_amount:  ${ledgerPost?.refund_amount}`);

  if (ledgerPost?.payment_status === "refunded") pass.push("C11: ledger.payment_status = refunded");
  else fail.push(`C11: ledger.payment_status = ${ledgerPost?.payment_status} (expected refunded)`);

  if (Number(ledgerPost?.refund_amount) > 0) pass.push(`C12: ledger.refund_amount = ${ledgerPost?.refund_amount}`);
  else fail.push(`C12: ledger.refund_amount = ${ledgerPost?.refund_amount} (expected >0)`);

  // 2g. Check financial events
  console.log("\n--- CHECK 7: Financial events ---");
  const finEventsRes = await supabase(`financial_events?metadata->booking_id=eq.${bookingId}&select=*`);
  const finEvents = finEventsRes.data || [];
  const eventTypes = finEvents.map((e) => e.event_type);
  console.log(`   Events found: ${eventTypes.join(", ") || "(none)"}`);

  if (eventTypes.includes("REFUND_COMPLETED")) pass.push("C13: REFUND_COMPLETED financial event");
  else fail.push("C13: REFUND_COMPLETED event missing");

  // 2h. Check audit log
  console.log("\n--- CHECK 8: Audit log ---");
  const auditRes = await supabase(`audit_logs?entity_id=eq.${bookingId}&select=*`);
  const auditLogs = auditRes.data || [];
  const auditActions = auditLogs.map((a) => a.action);
  console.log(`   Audit actions: ${auditActions.join(", ") || "(none)"}`);

  if (auditActions.includes("booking.refund.issued")) pass.push("C14: audit log booking.refund.issued");
  else fail.push("C14: audit log booking.refund.issued missing");

  if (auditActions.includes("booking.refund.partial_failure")) {
    fail.push("C15: booking.refund.partial_failure audit entry found (secondary step failed)");
  } else {
    pass.push("C15: no booking.refund.partial_failure entries (all secondary steps passed)");
  }

  printSummary(pass, fail);
}

function printSummary(pass, fail) {
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60));
  for (const p of pass) console.log(`  PASS  ${p}`);
  for (const f of fail) console.log(`  FAIL  ${f}`);
  console.log("-".repeat(60));
  console.log(`  ${pass.length} passed / ${fail.length} failed`);

  if (fail.length === 0) {
    console.log("\n  Revenue Ready = YES");
  } else if (fail.length <= 2) {
    console.log("\n  Revenue Ready = GO WITH CAUTION");
    console.log("  Review FAIL items above before first real booking.");
  } else {
    console.log("\n  Revenue Ready = NO");
    console.log("  Critical failures detected. Fix before accepting live bookings.");
  }
  console.log("=".repeat(60) + "\n");
}

// ── Entry point ──────────────────────────────────────────────────────────────
const [,, stage, bookingId] = process.argv;
if (stage === "stage1") {
  stage1().catch(console.error);
} else if (stage === "stage2" && bookingId) {
  stage2(bookingId).catch(console.error);
} else {
  console.log("Usage:");
  console.log("  node scripts/validate-revenue-final.mjs stage1");
  console.log("  node scripts/validate-revenue-final.mjs stage2 <booking_id>");
}
