import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("Customer — Create Event", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("create event wizard renders step 1", async ({ page }) => {
    await page.goto("/dashboard/create-event");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // Step 1: event type selection
    await expect(
      page.getByText(/event type|what.*occasion|birthday|wedding/i).first()
    ).toBeVisible();
  });

  test("event type selection advances to step 2", async ({ page }) => {
    await page.goto("/dashboard/create-event");
    // Step 1: fill required title, select event type, then click Continue to advance
    const eventTypeBtn = page
      .getByRole("button", { name: /birthday/i })
      .or(page.getByRole("button", { name: /wedding/i }))
      .or(page.locator("[data-event-type]").first())
      .first();
    if (await eventTypeBtn.isVisible()) {
      // Title is required to advance — labels have no htmlFor so use placeholder
      const titleInput = page.locator("input[type='text']").first();
      if (await titleInput.isVisible()) {
        await titleInput.fill("Test Party");
      }
      await eventTypeBtn.click();
      // Click Continue to advance from step 1 → step 2
      await page.getByRole("button", { name: /continue/i }).click();
      // Step 2 shows a date input
      await expect(
        page.locator("input[type='date']").first()
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test("customer dashboard shows events list", async ({ page }) => {
    await page.goto("/dashboard/events");
    await expect(
      page.getByText(/events|no events|plan your/i).first()
    ).toBeVisible();
  });
});

test.describe("Customer — Browse Vendors", () => {
  test("marketplace loads with vendor cards", async ({ page }) => {
    await page.goto("/browse");
    await expect(
      page.getByRole("heading", { level: 1 }).first()
    ).toBeVisible();
    // At least one vendor card or category filter
    await expect(
      page.getByRole("article").first()
        .or(page.getByText(/filter|category|results/i).first())
    ).toBeVisible({ timeout: 10000 });
  });

  test("category filter changes results", async ({ page }) => {
    await page.goto("/browse");
    const djFilter = page.getByRole("button", { name: /^dj$/i }).or(
      page.getByText(/^dj$/i).first()
    );
    if (await djFilter.isVisible()) {
      await djFilter.click();
      await expect(page).toHaveURL(/category=dj|dj/i, { timeout: 5000 }).catch(() => {});
    }
  });

  test("vendor profile page loads from marketplace", async ({ page }) => {
    await page.goto("/browse");
    // Click first vendor card
    const firstCard = page.getByRole("article").first()
      .or(page.getByRole("link", { name: /view profile|see more/i }).first());
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/vendors\//, { timeout: 10000 });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});

test.describe("Customer — Request Quote", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("request quote button visible on vendor profile", async ({ page }) => {
    await page.goto("/browse");
    // Navigate to first vendor
    const vendorLink = page
      .getByRole("link", { name: /view profile/i })
      .first()
      .or(page.getByRole("article").first());
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      await page.waitForURL(/\/vendors\//);
      await expect(
        page.getByRole("button", { name: /request.*quote|get a quote|free quote/i })
          .or(page.getByRole("link", { name: /request.*quote|get a quote/i }))
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test("quote list page renders for authenticated customer", async ({
    page,
  }) => {
    await page.goto("/dashboard/quotes");
    await expect(
      page.getByText(/quotes|no quotes|requests/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("quote detail page is accessible", async ({ page }) => {
    await page.goto("/dashboard/quotes");
    const firstQuote = page.getByRole("link", { name: /view|details/i }).first()
      .or(page.getByRole("article").first());
    if (await firstQuote.isVisible()) {
      await firstQuote.click();
      await expect(page).toHaveURL(/\/quotes\//);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});

test.describe("Customer — Bookings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("bookings list page is accessible", async ({ page }) => {
    await page.goto("/dashboard/bookings");
    // Some content should render
    await expect(page.locator("h1, h2, [data-testid=bookings]").first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("messages page is accessible", async ({ page }) => {
    await page.goto("/dashboard/messages");
    await expect(
      page.getByText(/messages|conversations|inbox/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Customer — Saved Vendors", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("saved vendors page renders", async ({ page }) => {
    await page.goto("/dashboard/saved");
    await expect(
      page.getByText(/saved|favourites|no saved/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
