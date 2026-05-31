import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });

const authCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const authPage = await authCtx.newPage();
await authPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await authPage.fill("[data-testid=email-input]", "james.bennett@elbold.demo");
await authPage.fill("[data-testid=password-input]", "ElboldDemo2026!");
await authPage.click("[type=submit]");
await authPage.waitForURL(/vendor/, { timeout: 12000 });
const state = await authCtx.storageState();
await authCtx.close();

const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: state });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/vendor/profile", { waitUntil: "networkidle" });
await page.waitForTimeout(700);

// Screenshot at top — header visible
await page.screenshot({ path: "scripts/audit-29c/sticky-at-top.png", fullPage: false });
console.log("✓ at top");

// Scroll the main element down 700px
await page.evaluate(() => { document.querySelector("main")?.scrollBy(0, 700); });
await page.waitForTimeout(400);

// Screenshot after scroll — sticky header must still be visible
await page.screenshot({ path: "scripts/audit-29c/sticky-after-scroll.png", fullPage: false });
console.log("✓ after scroll (sticky header should persist)");

await ctx.close();
await browser.close();
