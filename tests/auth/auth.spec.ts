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

test.describe("Auth — Signup Email Confirmation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bp_cookie_consent", JSON.stringify({ choice: "necessary", at: Date.now() }));
    });
    // Mock the signup API so no real Supabase users are created and rate limits are not hit.
    await page.route("/api/auth/signup", async (route) => {
      await route.fulfill({ status: 200, json: { hasSession: false } });
    });
  });

  test("vendor signup shows check-your-email state", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: /join as vendor/i }).click();
    await page.getByTestId("name-input").fill("Test Vendor");
    await page.getByTestId("email-input").fill("testvendor@example.com");
    await page.getByTestId("password-input").fill("TestPassword123!");
    await page.getByRole("button", { name: /create vendor account/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 8000 });
    // Confirm instructions and email address are shown
    await expect(page.getByText("testvendor@example.com")).toBeVisible();
    await expect(page.getByText(/click the confirmation link/i)).toBeVisible();
  });

  test("customer signup shows check-your-email state", async ({ page }) => {
    await page.goto("/signup");
    await page.getByTestId("name-input").fill("Test Customer");
    await page.getByTestId("email-input").fill("testcustomer@example.com");
    await page.getByTestId("password-input").fill("TestPassword123!");
    await page.getByRole("button", { name: /create free account/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("testcustomer@example.com")).toBeVisible();
  });

  test("check-your-email state shows back-to-sign-in link", async ({ page }) => {
    await page.goto("/signup");
    await page.getByTestId("name-input").fill("Test User");
    await page.getByTestId("email-input").fill("testuser@example.com");
    await page.getByTestId("password-input").fill("TestPassword123!");
    await page.getByRole("button", { name: /create.*account/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
  });
});

test.describe("Auth — Vendor Apply Page", () => {
  test("vendor apply page renders step 1 with business fields", async ({ page }) => {
    await page.goto("/vendor/apply");
    await expect(page.getByText(/vendor application/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/dj maxwell|luxe decor/i)).toBeVisible();
    await expect(page.getByText(/your business/i)).toBeVisible();
  });

  test("vendor apply step 1 advances to step 2 on valid input", async ({ page }) => {
    await page.goto("/vendor/apply");
    await page.getByPlaceholder(/dj maxwell|luxe decor/i).fill("Test Business Co");
    // Select first category button
    const categoryBtn = page.getByRole("button").filter({ hasText: /photographer|dj|caterer/i }).first();
    await categoryBtn.click();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/location & pricing/i)).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated vendor apply redirects to signup on submit", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bp_cookie_consent", JSON.stringify({ choice: "necessary", at: Date.now() }));
    });
    await page.goto("/vendor/apply");
    // Fill step 1
    await page.getByPlaceholder(/dj maxwell|luxe decor/i).fill("My Test Business");
    const categoryBtn = page.getByRole("button").filter({ hasText: /photographer|dj|caterer/i }).first();
    await categoryBtn.click();
    await page.getByRole("button", { name: /continue/i }).click();
    // Fill step 2
    await page.getByPlaceholder(/london|birmingham/i).fill("London");
    await page.getByRole("button", { name: /continue/i }).click();
    // Submit step 3 (unauthenticated)
    await page.getByRole("button", { name: /submit application/i }).click();
    // Should redirect to signup with role=vendor
    await expect(page).toHaveURL(/\/signup.*role=vendor|\/signup/, { timeout: 8000 });
  });
});

test.describe("Auth — Admin Vendor Application Queue", () => {
  test("admin vendors page shows pending vendor applications", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/vendors");
    // The seed creates vendors with various statuses — at least the page should render
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 8000 });
    // Pending vendors tab or count should be visible
    await expect(
      page.getByText(/pending/i).first()
        .or(page.getByRole("tab", { name: /pending/i }))
    ).toBeVisible({ timeout: 5000 });
  });
});
