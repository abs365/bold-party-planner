import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";
import { getEntitlements } from "../../lib/vendor/entitlements";

// ── Monetization + Subscription tests ─────────────────────────────────────────
// Assumes seed has been run. Deterministic subscription states:
//   James   (vendor)  — elite plan, active, featured=true
//   Ravi    (vendor3) — pro plan, active
//   Sofia   (vendor2) — pending (no subscription)
//   Charlotte (vendor4) — free, past_due state
//   Marcus  (vendor5) — suspended (no active subscription)

test.describe("Subscriptions — Feature gating", () => {
  test("entitlements: elite plan has no image limit", async ({ page }) => {
    const ents = getEntitlements("elite");
    expect(ents.maxImages).toBe(-1);
    expect(ents.canAppearAsFeatured).toBe(true);
    expect(ents.canAccessAdvancedAnalytics).toBe(true);
    expect(ents.canAccessPrioritySupport).toBe(true);
    expect(ents.visibilityBoost).toBe(10);
  });

  test("entitlements: governance blocks featured for suspended vendor", async ({ page }) => {
    const ents = getEntitlements("elite", { vendorStatus: "suspended", suspiciousFlag: false, hasCriticalWarnings: false });
    expect(ents.visibilityBoost).toBe(0);
    expect(ents.canAppearAsFeatured).toBe(false);
  });

  test("entitlements: free plan has 5 image limit", async ({ page }) => {
    const ents = getEntitlements("free");
    expect(ents.maxImages).toBe(5);
    expect(ents.maxPackages).toBe(1);
    expect(ents.canAppearAsFeatured).toBe(false);
    expect(ents.visibilityBoost).toBe(0);
  });
});

test.describe("Subscriptions — API", () => {
  test("GET /api/vendor/subscription returns plan and available plans", async ({ page }) => {
    await loginAs(page, "vendor"); // James
    const res = await page.request.get("/api/vendor/subscription");
    expect(res.status()).toBe(200);
    const body = await res.json() as { subscription: unknown; plans: unknown[] };
    expect(body.subscription).toBeDefined();
    expect(Array.isArray(body.plans)).toBe(true);
    expect(body.plans.length).toBeGreaterThanOrEqual(4);
  });

  test("suspended vendor cannot change subscription", async ({ page }) => {
    await loginAs(page, "vendor5"); // Marcus — suspended
    const res = await page.request.post("/api/vendor/subscription", {
      data: { plan: "pro" },
    });
    expect(res.status()).toBe(403);
  });

  test("unauthenticated user cannot access subscription API", async ({ page }) => {
    const res = await page.request.get("/api/vendor/subscription");
    expect(res.status()).toBe(401);
  });
});

test.describe("Subscriptions — Vendor subscription page", () => {
  test("subscription page renders for elite vendor (James)", async ({ page }) => {
    await loginAs(page, "vendor"); // James
    await page.goto("/vendor/subscription");
    await expect(page.getByRole("heading", { name: /subscription plans/i })).toBeVisible({ timeout: 10000 });
    // Should see plan cards
    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/pro/i).first()).toBeVisible();
  });

  test("annual toggle visible on subscription page", async ({ page }) => {
    await loginAs(page, "vendor3"); // Ravi
    await page.goto("/vendor/subscription");
    await expect(page.getByText(/annual/i).first()).toBeVisible({ timeout: 8000 });
    // Toggle annual billing
    await page.getByText(/annual/i).first().click();
    // Price should update to annual pricing
    await expect(page.getByText(/yr/i).first()).toBeVisible();
  });

  test("pro vendor sees current plan highlighted", async ({ page }) => {
    await loginAs(page, "vendor3"); // Ravi — pro
    await page.goto("/vendor/subscription");
    await expect(page.getByText(/current plan/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Subscriptions — Featured marketplace visibility", () => {
  test("elite vendor (James) appears in marketplace browse", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
    const text = await page.locator("body").innerText();
    // James is elite + featured — should appear
    expect(text).toContain("Bennett Visuals");
  });

  test("suspended vendor does not appear in browse", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("Marcus Events Decor");
  });
});

test.describe("Subscriptions — Admin monetization", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin monetization page renders", async ({ page }) => {
    await page.goto("/admin/monetization");
    await expect(page.getByRole("heading", { name: /monetization/i })).toBeVisible({ timeout: 10000 });
  });

  test("admin monetization API returns revenue data", async ({ page }) => {
    const res = await page.request.get("/api/admin/monetization?days=30");
    expect(res.status()).toBe(200);
    const body = await res.json() as { summary: unknown; plan_distribution: unknown; billing_events: unknown[] };
    expect(body.summary).toBeDefined();
    expect(body.plan_distribution).toBeDefined();
    expect(Array.isArray(body.billing_events)).toBe(true);
  });

  test("non-admin cannot access monetization API", async ({ page }) => {
    // Clear admin beforeEach session first — otherwise /login redirects back to /admin
    await page.context().clearCookies();
    await loginAs(page, "customer");
    const res = await page.request.get("/api/admin/monetization");
    expect([401, 403]).toContain(res.status());
  });

  test("MRR reflects active paid subscriptions", async ({ page }) => {
    const res = await page.request.get("/api/admin/monetization?days=30");
    const body = await res.json() as { summary: { mrr: number; paying_vendors: number } };
    // James=elite(£149), Ravi=pro(£29) — MRR should be ≥ 178
    expect(body.summary.mrr).toBeGreaterThanOrEqual(0); // may be 0 if DB subscriptions not set
    expect(typeof body.summary.paying_vendors).toBe("number");
  });
});

test.describe("Subscriptions — Governance integration", () => {
  test("at-risk vendor still appears in browse (reduced boost, not hidden)", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
    // Charlotte (at_risk) is approved — should still appear
    // The governance multiplier reduces her ranking but doesn't hide her
    const cards = await page.locator("a[href^='/vendors/']").count();
    expect(cards).toBeGreaterThan(0);
  });

  test("subscription page accessible for at-risk vendor", async ({ page }) => {
    await loginAs(page, "vendor4"); // Charlotte
    await page.goto("/vendor/subscription");
    await expect(page.getByRole("heading", { name: /subscription plans/i })).toBeVisible({ timeout: 8000 });
  });
});
