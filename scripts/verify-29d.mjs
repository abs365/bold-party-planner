import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const OUT  = "scripts/audit-29d1";
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// ── Fix 1: CookieConsent — fresh context (no localStorage) ───────────────────
console.log("\n── Fix 1: CookieConsent hydration ──");
{
  // No stored consent — banner should appear after client load (not during SSR)
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200); // let dynamic import fire
  await page.screenshot({ path: `${OUT}/cookie-banner-desktop.png`, fullPage: false });

  const hydrationErrors = errors.filter((e) =>
    e.toLowerCase().includes("hydrat") ||
    e.toLowerCase().includes("mismatch") ||
    e.toLowerCase().includes("did not expect")
  );
  console.log(hydrationErrors.length === 0
    ? "  ✓ No hydration errors in console"
    : `  ✗ Hydration errors: ${hydrationErrors.join("; ")}`
  );
  console.log(`  ✓ cookie-banner-desktop.png`);
  await ctx.close();
}

// Mobile — banner visible
{
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/apply", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/cookie-banner-mobile-apply.png`, fullPage: false });
  console.log("  ✓ cookie-banner-mobile-apply.png");
  await ctx.close();
}

// ── Fix 3: Verification Centre text ──────────────────────────────────────────
console.log("\n── Fix 3: Verification text ──");
{
  const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const auth    = await authCtx.newPage();
  await auth.goto(BASE + "/login", { waitUntil: "networkidle" });
  await auth.fill("[data-testid=email-input]",    "james.bennett@elbold.demo");
  await auth.fill("[data-testid=password-input]", "ElboldDemo2026!");
  await auth.click("[type=submit]");
  await auth.waitForURL(/vendor/, { timeout: 12000 });
  const ss = await authCtx.storageState();
  await authCtx.close();

  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ss });
  const page = await ctx.newPage();
  await page.goto(BASE + "/vendor/verification", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/verification-text-fixed.png`, fullPage: true });
  console.log("  ✓ verification-text-fixed.png");

  // Check text content
  const l1 = await page.locator('text="Level 1"').first().textContent();
  console.log(l1?.includes("â€")
    ? `  ✗ Still corrupted: ${l1}`
    : `  ✓ Level 1 renders correctly: "${l1?.trim()}"`
  );
  await ctx.close();
}

await browser.close();
console.log(`\nScreenshots → ./${OUT}/`);
