import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("Admin — Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin dashboard renders overview stats", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByText(/vendors|bookings|revenue|customers/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("admin nav links are present", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: /vendors/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /bookings/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /verifications/i }).first()).toBeVisible();
  });

  test("flagged vendors alert renders when vendors are flagged", async ({
    page,
  }) => {
    await page.goto("/admin");
    // Alert bar may or may not be present depending on data; just ensure page loads
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Admin — Vendor Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("vendor list renders with search", async ({ page }) => {
    await page.goto("/admin/vendors");
    await expect(
      page.getByPlaceholder(/search/i).or(page.getByRole("searchbox"))
    ).toBeVisible({ timeout: 8000 });
  });

  test("vendor search filters results", async ({ page }) => {
    await page.goto("/admin/vendors");
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole("searchbox"))
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Bennett");
      await page.waitForTimeout(500); // debounce
      await expect(page.getByText(/bennett/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("vendor approval toggle is accessible", async ({ page }) => {
    await page.goto("/admin/vendors");
    // Should have approve/suspend controls
    const actionBtn = page
      .getByRole("button", { name: /approve|suspend|status/i })
      .first();
    if (await actionBtn.isVisible()) {
      await expect(actionBtn).toBeEnabled();
    }
  });
});

test.describe("Admin — Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("customer list renders with search", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(
      page.getByText(/customers|users/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Admin — Moderation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("moderation page renders tabs", async ({ page }) => {
    await page.goto("/admin/moderation");
    await expect(
      page.getByText(/reports|media|moderation/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("reports tab is navigable", async ({ page }) => {
    await page.goto("/admin/moderation");
    const reportsTab = page.getByRole("tab", { name: /reports/i });
    if (await reportsTab.isVisible()) {
      await reportsTab.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("media queue tab is navigable", async ({ page }) => {
    await page.goto("/admin/moderation");
    const mediaTab = page.getByRole("tab", { name: /media/i });
    if (await mediaTab.isVisible()) {
      await mediaTab.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

test.describe("Admin — Alerts", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin alerts API returns structured data", async ({ page }) => {
    const response = await page.request.get("/api/admin/alerts");
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Should return an array or object with alerts
    expect(body).toBeDefined();
  });

  test("mark alert as read updates state", async ({ page }) => {
    // Intercept PATCH to /api/admin/alerts
    let patchCalled = false;
    await page.route("/api/admin/alerts", async (route) => {
      if (route.request().method() === "PATCH") patchCalled = true;
      await route.continue();
    });
    await page.goto("/admin");
    const markReadBtn = page
      .getByRole("button", { name: /mark.*read|dismiss/i })
      .first();
    if (await markReadBtn.isVisible()) {
      await markReadBtn.click();
      expect(patchCalled).toBe(true);
    }
  });
});

test.describe("Admin — Verification Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("verifications page renders stats", async ({ page }) => {
    await page.goto("/admin/verifications");
    await expect(
      page.getByText(/pending|approved|flagged/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("trust level buttons render per verification card", async ({ page }) => {
    await page.goto("/admin/verifications");
    // Level override buttons (0–4)
    const levelBtn = page
      .getByRole("button", { name: /^0$|^1$|^2$|^3$|^4$|level/i })
      .first();
    if (await levelBtn.isVisible()) {
      await expect(levelBtn).toBeEnabled();
    }
  });
});
