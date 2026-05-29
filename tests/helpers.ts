import { Page } from "@playwright/test";

// Deterministic demo accounts from TESTER_GUIDE.md
// Passwords are set via /api/auth/create-demo-users in global setup
export const ACCOUNTS = {
  customer: {
    email: "emily.carter@elbold.demo",
    password: "ElboldDemo2026!",
    name: "Emily Carter",
  },
  customer2: {
    email: "oliver.webb@elbold.demo",
    password: "ElboldDemo2026!",
    name: "Oliver Webb",
  },
  vendor: {
    email: "james.bennett@elbold.demo",
    password: "ElboldDemo2026!",
    name: "James Bennett",
    business: "Bennett Visuals",
  },
  vendor2: {
    email: "sofia.martinez@elbold.demo",
    password: "ElboldDemo2026!",
    name: "Sofia Martinez",
    business: "Sofia Blooms",
  },
  // vendor3 — approved, level 1, no social/availability → score 63 "Almost Ready"
  vendor3: {
    email: "ravi.patel@elbold.demo",
    password: "ElboldDemo2026!",
    name: "Ravi Patel",
    business: "Spice & Grace Catering",
  },
  // vendor4 — approved, level 0, no verification → score 59, not marketplace-ready
  vendor4: {
    email: "charlotte.hughes@elbold.demo",
    password: "ElboldDemo2026!",
    name: "Charlotte Hughes",
    business: "Charlotte DJ Services",
  },
  // vendor5 — suspended after seed run → "Account Suspended" onboarding state
  vendor5: {
    email: "marcus.thompson@elbold.demo",
    password: "ElboldDemo2026!",
    name: "Marcus Thompson",
    business: "Marcus Events Decor",
  },
  admin: {
    email: "admin@elbold.demo",
    password: "ElboldDemo2026!",
  },
};

export async function loginAs(
  page: Page,
  role: keyof typeof ACCOUNTS
): Promise<void> {
  const account = ACCOUNTS[role];
  await page.goto("/login");

  // Use data-testid — login form labels have no htmlFor associations
  await page.getByTestId("email-input").fill(account.email);
  await page.getByTestId("password-input").fill(account.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for post-login navigation (any dashboard)
  await page.waitForURL(/\/(dashboard|vendor\/dashboard|admin)/, {
    timeout: 20000,
  });
}

export async function logout(page: Page): Promise<void> {
  // Clear browser cookies — most reliable way to sign out in tests
  // (avoids depending on the signout API redirect URL being correct)
  await page.context().clearCookies();
  await page.goto("/login");
}

export async function expectRedirectToLogin(
  page: Page,
  protectedPath: string
): Promise<void> {
  await page.goto(protectedPath);
  await page.waitForURL(/\/login/, { timeout: 10000 });
}
