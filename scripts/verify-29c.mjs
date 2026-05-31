import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const OUT  = "scripts/audit-29c";
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function loginVendor() {
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill('[data-testid="email-input"]',    "james.bennett@elbold.demo");
  await page.fill('[data-testid="password-input"]', "ElboldDemo2026!");
  await page.click('[type="submit"]');
  await page.waitForURL(/vendor/, { timeout: 12000 });
  const ss = await ctx.storageState();
  await ctx.close();
  return ss;
}

const ss = await loginVendor();
console.log("  ✓ Logged in");

// ── 1. Sticky header — profile desktop ──
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  // Screenshot at top
  await page.screenshot({ path: `${OUT}/profile-top-desktop.png`, fullPage: false });
  console.log("  ✓ profile-top-desktop");
  // Scroll to middle
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/profile-scrolled-desktop.png`, fullPage: false });
  console.log("  ✓ profile-scrolled-desktop (sticky header should still show)");
  await ctx.close();
}

// ── 2. Sticky header — profile mobile ──
{
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/profile-top-mobile.png`, fullPage: false });
  console.log("  ✓ profile-top-mobile");
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/profile-scrolled-mobile.png`, fullPage: false });
  console.log("  ✓ profile-scrolled-mobile (sticky Save Changes must be visible)");
  await ctx.close();
}

// ── 3. Services — add package form with pricing type ──
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // Click Add Package button
  await page.getByRole("button", { name: /Add Package/i }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/services-pkg-form-desktop.png`, fullPage: true });
  console.log("  ✓ services-pkg-form-desktop (pricing type selector should be visible)");
  await ctx.close();
}

// ── 4. Services form — mobile ──
{
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Add Package/i }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/services-pkg-form-mobile.png`, fullPage: false });
  console.log("  ✓ services-pkg-form-mobile");
  await ctx.close();
}

// ── 5. Services form — Price on Request selected ──
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Add Package/i }).first().click();
  await page.waitForTimeout(500);
  // Click "Price on Request" button
  await page.getByRole("button", { name: /Price on Request/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/services-por-selected.png`, fullPage: true });
  console.log("  ✓ services-por-selected (price field should disappear)");
  await ctx.close();
}

// ── 6. Services existing packages (with pricing_type = fixed for demo) ──
{
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/services-packages-list.png`, fullPage: true });
  console.log("  ✓ services-packages-list");
  await ctx.close();
}

await browser.close();
console.log(`\nScreenshots → ./${OUT}/`);
