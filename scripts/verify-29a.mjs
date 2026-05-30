import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const OUT  = "scripts/vendor-audit-29a";
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

// Helper
async function shot(name, url, opts = {}) {
  const { width = 1440, height = 900, fullPage = true, storageState } = opts;
  const ctx  = await browser.newContext({ viewport: { width, height }, ...(storageState ? { storageState } : {}) });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
    console.log(`  ✓ ${name}`);
  } catch (e) { console.log(`  ✗ ${name}: ${e.message}`); }
  finally { await ctx.close(); }
}

// --- C1: onboarding emoji ---
console.log("\n── C1: Onboarding emoji fix ──");
{
  const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await authCtx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle", timeout: 15000 });
  await page.fill('[data-testid="email-input"]',    "james.bennett@boldparty.demo");
  await page.fill('[data-testid="password-input"]', "BoldPartyDemo2026!");
  await page.click('[type="submit"]');
  await page.waitForURL(/\/vendor\/dashboard|\/vendor\/onboarding/, { timeout: 12000 });
  const ss = await authCtx.storageState();

  // Onboarding — check emoji is gone
  const pg2 = await authCtx.newPage();
  await pg2.goto(BASE + "/vendor/onboarding", { waitUntil: "networkidle" });
  await pg2.waitForTimeout(600);
  await pg2.screenshot({ path: `${OUT}/c1-onboarding-fixed.png`, fullPage: false });
  console.log("  ✓ c1-onboarding-fixed");

  // Same on mobile
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: ss });
  const mp   = await mCtx.newPage();
  await mp.goto(BASE + "/vendor/onboarding", { waitUntil: "networkidle" });
  await mp.waitForTimeout(600);
  await mp.screenshot({ path: `${OUT}/c1-onboarding-mobile.png`, fullPage: false });
  console.log("  ✓ c1-onboarding-mobile");
  await authCtx.close();
  await mCtx.close();
}

// --- C2: cookie banner mobile ---
console.log("\n── C2: Cookie banner mobile ──");
{
  // Fresh context (no localStorage = consent not set = banner shows)
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/apply", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/c2-apply-mobile-banner.png`, fullPage: false });
  console.log("  ✓ c2-apply-mobile-banner");
  await ctx.close();
}

// --- H1: homepage vendor CTA ---
console.log("\n── H1: Homepage vendor CTA ──");
await shot("h1-homepage-cta", "/", { fullPage: false });

// --- H2: signup default tab ---
console.log("\n── H2: Signup role pre-select ──");
await shot("h2-signup-default",      "/signup",            { fullPage: false });
await shot("h2-signup-vendor-param", "/signup?role=vendor",{ fullPage: false });

// --- H3 + H4: dashboard first-login state (use a freshly seeded vendor) ---
console.log("\n── H3/H4: Dashboard first-login banner ──");
{
  const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await authCtx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle", timeout: 15000 });
  await page.fill('[data-testid="email-input"]',    "james.bennett@boldparty.demo");
  await page.fill('[data-testid="password-input"]', "BoldPartyDemo2026!");
  await page.click('[type="submit"]');
  await page.waitForURL(/\/vendor\/dashboard|\/vendor\/onboarding/, { timeout: 12000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/h3-h4-dashboard.png`, fullPage: true });
  console.log("  ✓ h3-h4-dashboard (James has high completion, no new-vendor banner expected)");

  // Also capture onboarding page to confirm no broken emoji
  const og = await authCtx.newPage();
  await og.goto(BASE + "/vendor/onboarding", { waitUntil: "networkidle" });
  await og.waitForTimeout(600);
  await og.screenshot({ path: `${OUT}/h4-onboarding-full.png`, fullPage: true });
  console.log("  ✓ h4-onboarding-full");
  await authCtx.close();
}

await browser.close();
console.log(`\nScreenshots → ./${OUT}/`);
