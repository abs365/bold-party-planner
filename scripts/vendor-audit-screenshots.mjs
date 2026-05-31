/**
 * Vendor Journey Screenshot Script
 * Captures the full vendor conversion flow for audit purposes.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const OUT  = "scripts/vendor-audit";

const PAGES = [
  { name: "01-homepage",           url: "/",                      fullPage: true,  width: 1440, height: 900  },
  { name: "02-homepage-mobile",    url: "/",                      fullPage: false, width: 390,  height: 844  },
  { name: "03-founding-vendors",   url: "/founding-vendors",      fullPage: true,  width: 1440, height: 900  },
  { name: "04-vendor-apply",       url: "/vendor/apply",          fullPage: true,  width: 1440, height: 900  },
  { name: "05-vendor-apply-mob",   url: "/vendor/apply",          fullPage: false, width: 390,  height: 844  },
  { name: "06-signup-vendor",      url: "/signup",                fullPage: true,  width: 1440, height: 900  },
  { name: "07-how-it-works",       url: "/how-it-works",          fullPage: true,  width: 1440, height: 900  },
  { name: "08-about",              url: "/about",                 fullPage: true,  width: 1440, height: 900  },
  { name: "09-browse",             url: "/browse",                fullPage: true,  width: 1440, height: 900  },
];

// Authenticated pages — use demo vendor credentials
const AUTHED_PAGES = [
  { name: "10-vendor-dashboard",   url: "/vendor/dashboard",      fullPage: true,  width: 1440, height: 900  },
  { name: "11-vendor-onboarding",  url: "/vendor/onboarding",     fullPage: true,  width: 1440, height: 900  },
  { name: "12-vendor-profile",     url: "/vendor/profile",        fullPage: true,  width: 1440, height: 900  },
  { name: "13-vendor-services",    url: "/vendor/services",       fullPage: true,  width: 1440, height: 900  },
  { name: "14-vendor-media",       url: "/vendor/media",          fullPage: true,  width: 1440, height: 900  },
  { name: "15-vendor-availability",url: "/vendor/availability",   fullPage: true,  width: 1440, height: 900  },
  { name: "16-vendor-subscription",url: "/vendor/subscription",   fullPage: true,  width: 1440, height: 900  },
  { name: "17-vendor-verification",url: "/vendor/verification",   fullPage: true,  width: 1440, height: 900  },
  { name: "18-vendor-dash-mobile", url: "/vendor/dashboard",      fullPage: false, width: 390,  height: 844  },
  { name: "19-vendor-onboard-mob", url: "/vendor/onboarding",     fullPage: false, width: 390,  height: 844  },
];

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

// ── Unauthenticated pages ─────────────────────────────────────────────────────
console.log("\n── Public pages ──");
for (const { name, url, fullPage, width, height } of PAGES) {
  const ctx  = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(800);
    const path = `${OUT}/${name}.png`;
    await page.screenshot({ path, fullPage });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
  } finally {
    await ctx.close();
  }
}

// ── Authenticated pages — log in as demo vendor ───────────────────────────────
console.log("\n── Vendor dashboard pages (demo login) ──");
const authCtx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const authPage = await authCtx.newPage();

try {
  await authPage.goto(BASE + "/login", { waitUntil: "networkidle", timeout: 15000 });
  await authPage.waitForTimeout(500);
  await authPage.fill('[data-testid="email-input"]',    "james.bennett@elbold.demo");
  await authPage.fill('[data-testid="password-input"]', "ElboldDemo2026!");
  await authPage.click('[type="submit"]');
  await authPage.waitForURL(/\/vendor\/dashboard|\/vendor\/onboarding/, { timeout: 12000 });
  console.log("  ✓ Logged in as vendor demo");
} catch (e) {
  console.log(`  ✗ Login failed: ${e.message}`);
}

for (const { name, url, fullPage, width, height } of AUTHED_PAGES) {
  const ctx  = width === 1440 ? authCtx : await browser.newContext({ viewport: { width, height }, storageState: await authCtx.storageState() });
  const page = width === 1440 ? authPage : await ctx.newPage();
  try {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(800);
    const path = `${OUT}/${name}.png`;
    await page.screenshot({ path, fullPage });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
  } finally {
    if (width !== 1440) await ctx.close();
  }
}

await browser.close();
console.log(`\nAll screenshots saved to ./${OUT}/`);
