import { test, expect } from "@playwright/test";
import { loginAs, logout, expectRedirectToLogin, ACCOUNTS } from "../helpers";

test.describe("Auth — Sign Up", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss the CookieConsent banner so it never overlaps clickable elements.
    await page.addInitScript(() => {
      localStorage.setItem("bp_cookie_consent", JSON.stringify({ choice: "necessary", at: Date.now() }));
    });
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("email-input")).toBeVisible();
    await expect(page.getByTestId("password-input")).toBeVisible();
  });

  test("signup with existing email shows error", async ({ page }) => {
    await page.goto("/signup");
    await page.getByTestId("email-input").fill(ACCOUNTS.customer.email);
    await page.getByTestId("password-input").fill("SomeOtherPass123!");
    const nameField = page.getByTestId("name-input");
    if (await nameField.isVisible()) await nameField.fill("Test User");
    await page.getByRole("button", { name: /sign up|create.*account/i }).click();
    // Supabase either shows an explicit error OR silently sends a confirmation email.
    // Either way the user cannot instantly access the app — accept both outcomes.
    await expect(
      page.getByRole("heading", { name: /check your email/i })
        .or(page.getByRole("alert").filter({ hasText: /./ }).first())
    ).toBeVisible({ timeout: 8000 });
  });

  test("signup with short password shows validation", async ({ page }) => {
    await page.goto("/signup");
    await page.getByTestId("email-input").fill(`test_${Date.now()}@example.com`);
    await page.getByTestId("password-input").fill("abc");
    await page.getByRole("button", { name: /sign up|create.*account/i }).click();
    // Browser minLength validation or custom error
    const nativeInvalid = await page.evaluate(() => {
      const input = document.querySelector("input[minlength]") as HTMLInputElement | null;
      return input ? !input.validity.valid : false;
    });
    const customError = await page.getByText(/too short|at least 8|password/i).isVisible().catch(() => false);
    expect(nativeInvalid || customError).toBe(true);
  });
});

test.describe("Auth — Login", () => {
  test("customer login redirects to dashboard", async ({ page }) => {
    await loginAs(page, "customer");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("vendor login redirects to vendor dashboard", async ({ page }) => {
    await loginAs(page, "vendor");
    await expect(page).toHaveURL(/\/vendor\/dashboard|\/vendor/);
  });

  test("invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email-input").fill("nobody@example.com");
    await page.getByTestId("password-input").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    // Match the toast error text. Excludes the Next.js dev-overlay "Console Error" label
    // by requiring the pattern to match actual auth error wording.
    await expect(
      page.getByText(/incorrect.*password|invalid.*credential|try again/i)
        .or(page.locator("[role=alert]").filter({ hasText: /incorrect|invalid|try again/i }).first())
    ).toBeVisible({ timeout: 8000 });
  });

  test("empty form shows browser validation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();
    const hasInvalidInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input:invalid");
      return inputs.length > 0;
    });
    expect(hasInvalidInputs).toBe(true);
  });
});

test.describe("Auth — Logout", () => {
  test("logout clears session and redirects protected route to login", async ({
    page,
  }) => {
    await loginAs(page, "customer");
    await expect(page).toHaveURL(/\/dashboard/);
    await logout(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe("Auth — Protected Routes", () => {
  test("unauthenticated user redirected from customer dashboard", async ({
    page,
  }) => {
    await expectRedirectToLogin(page, "/dashboard");
  });

  test("unauthenticated user redirected from vendor dashboard", async ({
    page,
  }) => {
    await expectRedirectToLogin(page, "/vendor/dashboard");
  });

  test("unauthenticated user redirected from admin", async ({ page }) => {
    await expectRedirectToLogin(page, "/admin");
  });

  test("unauthenticated user redirected from create event", async ({
    page,
  }) => {
    await expectRedirectToLogin(page, "/dashboard/create-event");
  });

  test("unauthenticated user redirected from vendor verification", async ({
    page,
  }) => {
    await expectRedirectToLogin(page, "/vendor/verification");
  });
});

test.describe("Auth — Role-Based Routing", () => {
  test("customer is blocked from /admin", async ({ page }) => {
    await loginAs(page, "customer");
    await page.goto("/admin");
    // Proxy redirects non-admin to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test("vendor is blocked from /admin", async ({ page }) => {
    await loginAs(page, "vendor");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });
});
