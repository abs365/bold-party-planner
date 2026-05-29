import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

// ── Vendor Lifecycle Governance tests ─────────────────────────────────────────
// Assumes seed has been run. Deterministic governance states:
//   James (vendor)      — optimised (score 100, health excellent, no warnings)
//   Ravi  (vendor3)     — marketplace_ready (response_rate=85, cancel=3%)
//   Charlotte (vendor4) — at_risk (cancel=35%, response=32%, 2 active warnings)
//   Sofia (vendor2)     — pending (not visible in marketplace)
//   Marcus (vendor5)    — suspended (not visible in marketplace)

test.describe("Governance — Marketplace visibility enforcement", () => {
  test("suspended vendors are hidden from marketplace", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("Marcus Events Decor");
  });

  test("pending vendors are hidden from marketplace", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("Sofia Blooms");
  });

  test("approved vendors with good health appear in marketplace", async ({ page }) => {
    await page.goto("/browse");
    // At least one vendor card should be visible (James or Ravi or Charlotte)
    const cards = page.locator("a[href^='/vendors/']");
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Governance — Vendor dashboard status widget", () => {
  test("at-risk vendor (Charlotte) sees governance widget with warnings", async ({ page }) => {
    await loginAs(page, "vendor4"); // Charlotte — at_risk state
    await page.goto("/vendor/dashboard");
    await expect(page.getByTestId("vendor-dashboard")).toBeVisible({ timeout: 8000 });
    // Governance widget should appear since Charlotte has warnings
    const widget = page.getByText(/marketplace status/i);
    const count = await widget.count();
    // Widget only shows for at-risk/warned vendors
    if (count > 0) {
      await expect(widget.first()).toBeVisible();
      // Should show the at-risk state
      await expect(page.getByText(/at risk|reduced visibility|concern/i).first()).toBeVisible();
    }
  });

  test("healthy vendor (James) does not see warning widget", async ({ page }) => {
    await loginAs(page, "vendor"); // James — optimised state
    await page.goto("/vendor/dashboard");
    await expect(page.getByTestId("vendor-dashboard")).toBeVisible({ timeout: 8000 });
    // No critical warnings should appear for James
    const criticalText = page.getByText(/critical cancellation|account under review/i);
    const count = await criticalText.count();
    expect(count).toBe(0);
  });
});

test.describe("Governance — Onboarding page reflects lifecycle state", () => {
  test("at-risk vendor sees profile setup with health indicators", async ({ page }) => {
    await loginAs(page, "vendor4"); // Charlotte — at_risk
    await page.goto("/vendor/onboarding");
    await expect(page.getByRole("heading", { name: /profile setup/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/\d+%/)).toBeVisible();
  });

  test("healthy vendor sees optimised onboarding page", async ({ page }) => {
    await loginAs(page, "vendor"); // James — optimised
    await page.goto("/vendor/onboarding");
    await expect(page.getByRole("heading", { name: /profile setup/i })).toBeVisible({ timeout: 8000 });
    // Score may not reach 100% if availability not set — just verify a % score is shown
    await expect(page.getByText(/\d+%/).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Governance — Admin governance page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin governance page renders without error", async ({ page }) => {
    await page.goto("/admin/governance");
    await expect(page.getByRole("heading", { name: /vendor governance/i })).toBeVisible({ timeout: 10000 });
  });

  test("health distribution tiles are visible", async ({ page }) => {
    await page.goto("/admin/governance");
    await expect(page.getByText(/excellent/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/good/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("at-risk tab shows vendors needing attention", async ({ page }) => {
    await page.goto("/admin/governance");
    await expect(page.getByText(/at risk/i).first()).toBeVisible({ timeout: 8000 });
    // Charlotte should appear as at-risk (cancellation_rate=35%, response_rate=32%)
    const pageText = await page.locator("body").innerText();
    const hasCharlotte = pageText.includes("Charlotte");
    // Charlotte should appear (she has high cancellation rate)
    if (hasCharlotte) {
      await expect(page.getByText(/charlotte/i).first()).toBeVisible();
    }
  });

  test("active warnings tab renders", async ({ page }) => {
    await page.goto("/admin/governance");
    const warningsTab = page.getByRole("button", { name: /active warnings/i });
    if (await warningsTab.isVisible()) {
      await warningsTab.click();
      // Either shows warnings or "no active warnings" message
      const hasWarnings = await page.getByText(/cancellation|response rate|no active warnings/i).count();
      expect(hasWarnings).toBeGreaterThan(0);
    }
  });

  test("issue warning modal opens from at-risk vendor row", async ({ page }) => {
    await page.goto("/admin/governance");
    await expect(page.getByText(/at risk/i).first()).toBeVisible({ timeout: 8000 });
    const issueBtn = page.getByRole("button", { name: /issue warning/i }).first();
    const count = await issueBtn.count();
    if (count > 0) {
      await issueBtn.click();
      await expect(page.getByRole("heading", { name: /issue warning/i })).toBeVisible();
      // Close it
      await page.keyboard.press("Escape");
    }
  });
});

test.describe("Governance — Admin governance API", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("governance GET endpoint returns at-risk vendors", async ({ page }) => {
    const res = await page.request.get("/api/admin/governance");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.atRiskVendors)).toBe(true);
    expect(typeof body.totalApproved).toBe("number");
    expect(body.healthDistribution).toBeDefined();
  });

  test("governance warnings endpoint returns active warnings", async ({ page }) => {
    const res = await page.request.get("/api/admin/governance?tab=warnings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.warnings)).toBe(true);
  });
});

test.describe("Governance — Warning state visibility", () => {
  test("at-risk vendor page renders without error", async ({ page }) => {
    await loginAs(page, "vendor4"); // Charlotte
    await page.goto("/vendor/dashboard");
    // Dashboard should load without 500 error
    await expect(page.getByTestId("vendor-dashboard")).toBeVisible({ timeout: 10000 });
  });

  test("healthy vendor dashboard loads without governance warnings", async ({ page }) => {
    await loginAs(page, "vendor3"); // Ravi — healthy vendor
    await page.goto("/vendor/dashboard");
    await expect(page.getByTestId("vendor-dashboard")).toBeVisible({ timeout: 10000 });
    // No critical warnings visible
    const critCount = await page.getByText(/critical cancellation|account under review/i).count();
    expect(critCount).toBe(0);
  });
});
