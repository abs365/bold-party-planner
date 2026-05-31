/**
 * Phase 29B — Full vendor journey screenshots for all 4 personas.
 * Captures every meaningful step a real vendor would encounter.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const OUT  = "scripts/audit-29b";
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(name, url, opts = {}) {
  const { w = 1440, h = 900, full = true, ss } = opts;
  const ctx  = await browser.newContext({ viewport: { width: w, height: h }, ...(ss ? { storageState: ss } : {}) });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
    console.log(`  ✓ ${name}`);
    return { ctx, page };
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    await ctx.close();
    return { ctx: null, page: null };
  }
}

async function shotClose(name, url, opts = {}) {
  const r = await shot(name, url, opts);
  if (r.ctx) await r.ctx.close();
}

// ── Login helper ──────────────────────────────────────────────────────────────
async function loginVendor(email = "james.bennett@elbold.demo") {
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill('[data-testid="email-input"]',    email);
  await page.fill('[data-testid="password-input"]', "ElboldDemo2026!");
  await page.click('[type="submit"]');
  await page.waitForURL(/vendor/, { timeout: 15000 });
  const ss = await ctx.storageState();
  await ctx.close();
  return ss;
}

// ── STAGE 1: PUBLIC PAGES ─────────────────────────────────────────────────────
console.log("\n── Stage 1: Public pages (desktop) ──");
await shotClose("s1-homepage-fold",     "/",                 { full: false });
await shotClose("s1-homepage-full",     "/",                 { full: true });
await shotClose("s1-founding-vendors",  "/founding-vendors", { full: true });
await shotClose("s1-how-it-works",      "/how-it-works",     { full: true });
await shotClose("s1-vendor-apply",      "/vendor/apply",     { full: true });
await shotClose("s1-signup-vendor",     "/signup?role=vendor",{ full: false });

console.log("\n── Stage 1: Public pages (mobile 390px) ──");
await shotClose("s1-m-homepage",        "/",                 { w: 390, h: 844, full: false });
await shotClose("s1-m-founding",        "/founding-vendors", { w: 390, h: 844, full: false });
await shotClose("s1-m-apply",           "/vendor/apply",     { w: 390, h: 844, full: false });
await shotClose("s1-m-signup",          "/signup?role=vendor",{ w: 390, h: 844, full: false });

// ── LOGIN ─────────────────────────────────────────────────────────────────────
console.log("\n── Logging in as demo vendor ──");
const ss = await loginVendor();
console.log("  ✓ Logged in");

// ── STAGE 5: FIRST LOGIN / ONBOARDING ────────────────────────────────────────
console.log("\n── Stage 5: Onboarding & dashboard ──");
await shotClose("s5-onboarding-full",   "/vendor/onboarding",  { full: true,  ss });
await shotClose("s5-onboarding-fold",   "/vendor/onboarding",  { full: false, ss });
await shotClose("s5-dashboard",         "/vendor/dashboard",   { full: true,  ss });
await shotClose("s5-dashboard-fold",    "/vendor/dashboard",   { full: false, ss });

// Mobile onboarding
await shotClose("s5-m-onboarding",      "/vendor/onboarding",  { w: 390, h: 844, full: false, ss });
await shotClose("s5-m-dashboard",       "/vendor/dashboard",   { w: 390, h: 844, full: false, ss });

// ── STAGE 6: PROFILE COMPLETION PAGES ────────────────────────────────────────
console.log("\n── Stage 6: Profile pages ──");
await shotClose("s6-profile-full",      "/vendor/profile",     { full: true,  ss });
await shotClose("s6-services-full",     "/vendor/services",    { full: true,  ss });
await shotClose("s6-media-full",        "/vendor/media",       { full: true,  ss });
await shotClose("s6-availability-full", "/vendor/availability",{ full: true,  ss });
await shotClose("s6-verification",      "/vendor/verification",{ full: true,  ss });
await shotClose("s6-subscription",      "/vendor/subscription",{ full: true,  ss });

// Mobile profile pages
await shotClose("s6-m-profile",         "/vendor/profile",     { w: 390, h: 844, full: false, ss });
await shotClose("s6-m-services",        "/vendor/services",    { w: 390, h: 844, full: false, ss });
await shotClose("s6-m-media",           "/vendor/media",       { w: 390, h: 844, full: false, ss });
await shotClose("s6-m-availability",    "/vendor/availability",{ w: 390, h: 844, full: false, ss });

// ── PACKAGE ADD FORM ──────────────────────────────────────────────────────────
console.log("\n── Package add form ──");
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // Click "+ Add Package" button
  try {
    await page.click('text="+ Add Package"', { timeout: 5000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/s6-pkg-add-form.png`, fullPage: true });
    console.log("  ✓ s6-pkg-add-form");
  } catch { console.log("  ✗ s6-pkg-add-form: could not open add form"); }
  await ctx.close();
}

// Mobile package form
{
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  try {
    await page.click('text="+ Add Package"', { timeout: 5000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/s6-m-pkg-add-form.png`, fullPage: false });
    console.log("  ✓ s6-m-pkg-add-form");
  } catch { console.log("  ✗ s6-m-pkg-add-form"); }
  await ctx.close();
}

// ── VENDOR PROFILE PUBLIC VIEW ────────────────────────────────────────────────
console.log("\n── Public vendor profile ──");
// Get vendor ID from profile page
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // Click "View Profile" button
  try {
    const link = page.locator('text="View Profile"').first();
    const href = await link.getAttribute('href');
    console.log(`  Profile URL: ${href}`);
    if (href) {
      const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const pg2  = await ctx2.newPage();
      await pg2.goto(BASE + href, { waitUntil: "networkidle" });
      await pg2.waitForTimeout(600);
      await pg2.screenshot({ path: `${OUT}/s7-public-profile.png`, fullPage: true });
      console.log("  ✓ s7-public-profile");
      await ctx2.close();

      const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const pg3  = await ctx3.newPage();
      await pg3.goto(BASE + href, { waitUntil: "networkidle" });
      await pg3.waitForTimeout(600);
      await pg3.screenshot({ path: `${OUT}/s7-m-public-profile.png`, fullPage: false });
      console.log("  ✓ s7-m-public-profile");
      await ctx3.close();
    }
  } catch (e) { console.log(`  ✗ public profile: ${e.message}`); }
  await ctx.close();
}

// ── AVAILABILITY: scroll to bottom for instructions ───────────────────────────
console.log("\n── Availability detail ──");
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/availability", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/s6-avail-scrolled.png`, fullPage: false });
  console.log("  ✓ s6-avail-scrolled");
  await ctx.close();
}

// ── BROWSE (how a vendor's category appears) ───────────────────────────────────
console.log("\n── Browse marketplace ──");
await shotClose("s7-browse-full",     "/browse",              { full: true  });
await shotClose("s7-browse-dj",       "/browse?category=dj",  { full: true  });
await shotClose("s7-browse-caterer",  "/browse?category=caterer", { full: true });
await shotClose("s7-browse-planner",  "/browse?category=event_planner", { full: true });

await browser.close();
console.log(`\nAll screenshots → ./${OUT}/`);
