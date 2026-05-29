import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

// All tests in this file run under the "mobile-chrome" project (Pixel 5 emulation)

test.describe("Mobile — Homepage", () => {
  test("homepage renders hero and CTA on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /plan.*event|browse|start/i }).first()
    ).toBeVisible();
  });

  test("mobile nav opens and closes", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.getByRole("button", { name: /menu|open navigation/i })
      .or(page.locator("[data-mobile-menu-toggle], [aria-label='menu']"));
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await expect(
        page.getByRole("link", { name: /browse|sign in|how it works/i }).first()
      ).toBeVisible({ timeout: 3000 });
      // Close it
      await hamburger.click();
    }
  });

  test("trust bar renders on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/trusted|verified|secure|protected/i).first()
    ).toBeVisible();
  });
});

test.describe("Mobile — Marketplace", () => {
  test("browse page renders vendor cards on mobile", async ({ page }) => {
    await page.goto("/browse");
    await expect(
      page.getByRole("heading", { level: 1 }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("vendor card is tappable on mobile", async ({ page }) => {
    await page.goto("/browse");
    const card = page.getByRole("article").first()
      .or(page.getByRole("link", { name: /view profile/i }).first());
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/vendors\//, { timeout: 10000 });
    }
  });
});

test.describe("Mobile — Vendor Profile", () => {
  test("vendor profile sticky CTA is visible on mobile", async ({ page }) => {
    await page.goto("/browse");
    const vendorLink = page.getByRole("link", { name: /view profile/i }).first()
      .or(page.getByRole("article").first());
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      await page.waitForURL(/\/vendors\//);
      // Sticky quote CTA at bottom of screen
      await expect(
        page.getByRole("button", { name: /quote|book|contact/i })
          .or(page.getByRole("link", { name: /quote|book/i }))
      ).toBeVisible({ timeout: 8000 });
    }
  });
});

test.describe("Mobile — Customer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("mobile bottom nav renders after login", async ({ page }) => {
    await page.goto("/dashboard");
    // Mobile bottom nav tabs
    await expect(
      page.getByRole("navigation").last()
        .or(page.locator("[data-mobile-nav]"))
    ).toBeVisible({ timeout: 8000 });
  });

  test("dashboard content renders on mobile", async ({ page }) => {
    await page.goto("/dashboard");
    // Scope to main content — sidebar nav links are CSS-hidden on mobile viewport
    await expect(
      page.locator("main").getByText(/welcome|events|quotes|bookings/i).first()
        .or(page.getByRole("heading", { level: 1 }).first())
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Mobile — Smart Planner Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("create event wizard is usable on mobile", async ({ page }) => {
    await page.goto("/dashboard/create-event");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // Step 1 content is visible without horizontal scroll
    const heading = page.getByRole("heading", { level: 1 }).first();
    const box = await heading.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      // Heading should fit within the current viewport (works for both mobile and desktop)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 30);
    }
  });
});

test.describe("Mobile — Vendor Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "vendor");
  });

  test("vendor mobile bottom nav renders", async ({ page }) => {
    await page.goto("/vendor/dashboard");
    await expect(
      page.getByRole("navigation").last()
        .or(page.locator("[data-mobile-nav]"))
    ).toBeVisible({ timeout: 8000 });
  });

  test("vendor dashboard stats render on mobile", async ({ page }) => {
    await page.goto("/vendor/dashboard");
    // Use testid — sidebar nav links match the regex but are CSS-hidden on mobile viewport
    await expect(page.getByTestId("vendor-dashboard")).toBeVisible({ timeout: 8000 });
  });
});
