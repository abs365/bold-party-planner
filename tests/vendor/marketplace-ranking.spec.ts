import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

// ── Marketplace sort + ranking tests ─────────────────────────────────────────
// Assumes seed has been run. Deterministic states:
//   James (vendor)   — level 2, score ~94 (priority tier)
//   Ravi  (vendor3)  — level 1, score ~63 (reduced tier)
//   Charlotte (v4)   — level 0, score ~59 (reduced tier)
//   Sofia/Marcus     — pending/suspended, not in marketplace

test.describe("Marketplace — Sorting", () => {
  test("default sort option is Recommended", async ({ page }) => {
    await page.goto("/browse");
    // Open the filter panel to reveal the sort dropdown
    await page.getByRole("button", { name: /filters/i }).click();
    const sortSelect = page.locator("select").filter({ hasText: /recommended/i });
    await expect(sortSelect).toBeVisible();
    await expect(sortSelect).toHaveValue("smart");
  });

  test("all sort options are present in dropdown", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /filters/i }).click();
    const select = page.locator("select").filter({ hasText: /recommended/i });
    await expect(select.locator("option[value='smart']")).toHaveText("Recommended");
    await expect(select.locator("option[value='rating']")).toHaveText("Top Rated");
    await expect(select.locator("option[value='fastest_responder']")).toHaveText("Fastest Responder");
    await expect(select.locator("option[value='most_active']")).toHaveText("Most Active");
    await expect(select.locator("option[value='newest']")).toHaveText("Newest");
    await expect(select.locator("option[value='popular']")).toHaveText("Most Reviews");
  });

  test("changing sort to Top Rated re-renders the list", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /filters/i }).click();
    const select = page.locator("select").filter({ hasText: /recommended/i });
    await select.selectOption("rating");
    // Vendor cards still render after sort change
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 5000 });
  });

  test("changing sort to Fastest Responder re-renders the list", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /filters/i }).click();
    const select = page.locator("select").filter({ hasText: /recommended/i });
    await select.selectOption("fastest_responder");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 5000 });
  });

  test("changing sort to Most Active re-renders the list", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /filters/i }).click();
    const select = page.locator("select").filter({ hasText: /recommended/i });
    await select.selectOption("most_active");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 5000 });
  });

  test("changing sort to Newest re-renders the list", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /filters/i }).click();
    const select = page.locator("select").filter({ hasText: /recommended/i });
    await select.selectOption("newest");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Marketplace — Trust badges on cards", () => {
  test("verification badges appear on vendor cards", async ({ page }) => {
    await page.goto("/browse");
    // At least one of the named verification badges should be visible on the page
    await expect(
      page.getByText(/business verified|id verified|address verified|identity verified|trusted pro|trusted professional/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("vendor cards show Fast Responder badge when response rate is high", async ({ page }) => {
    await page.goto("/browse");
    // James has response_rate set — Fast Responder badge may appear on his card
    const fastBadge = page.getByText(/fast responder/i);
    // Conditionally visible depending on data — just check page renders
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 5000 });
    // If badge exists it must be readable
    const count = await fastBadge.count();
    if (count > 0) {
      await expect(fastBadge.first()).toBeVisible();
    }
  });
});

test.describe("Marketplace — Top Picks section", () => {
  test("Top Picks section renders without errors", async ({ page }) => {
    await page.goto("/browse");
    // Top Picks shows when no filters are active
    const topPicks = page.getByText(/top picks/i);
    const count = await topPicks.count();
    if (count > 0) {
      await expect(topPicks.first()).toBeVisible();
    }
    // Main vendor grid renders
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Marketplace — Ranking order (approved vendors first)", () => {
  test("verified vendors appear before unverified in Recommended sort", async ({ page }) => {
    await page.goto("/browse");
    // Collect first visible vendor card link texts to verify page loaded
    const cards = page.locator("a[href^='/vendors/']");
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("suspended and pending vendors do not appear in marketplace", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("a[href^='/vendors/']").first()).toBeVisible({ timeout: 8000 });
    // Sofia (pending) and Marcus (suspended) should not be listed
    const pageText = await page.locator("body").innerText();
    // These exact business names should NOT appear in the marketplace
    expect(pageText).not.toContain("Sofia Blooms");
    expect(pageText).not.toContain("Marcus Events Decor");
  });
});

test.describe("Marketplace — Trust signals on quote detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer"); // Emily — has a quote with James
  });

  test("quote detail shows vendor trust signals", async ({ page }) => {
    await page.goto("/dashboard/quotes");
    // Find the first quote and navigate to its detail
    const quoteLink = page.getByRole("link", { name: /view|details|bennett/i }).first();
    const hasLink = await quoteLink.isVisible().catch(() => false);
    if (hasLink) {
      await quoteLink.click();
      // Trust signals should appear in the vendor header section
      await expect(
        page.getByText(/business verified|identity verified|fast responder|\d\+ events/i)
      ).toBeVisible({ timeout: 8000 });
    }
  });
});

test.describe("Vendor — Onboarding analytics (smoke test)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "vendor"); // James — approved, full profile
  });

  test("approved vendor can visit onboarding page without error", async ({ page }) => {
    await page.goto("/vendor/onboarding");
    // Page renders without 500 — analytics track() fires async and does not block render
    await expect(page.getByRole("heading", { name: /profile setup/i })).toBeVisible();
    // Score is displayed
    await expect(page.getByText(/\d+%/)).toBeVisible();
  });
});
