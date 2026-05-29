# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security\security.spec.ts >> Security — Upload Validation >> upload rejects disallowed MIME type
- Location: tests\security\security.spec.ts:129:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]:
        - img [ref=e18]
  - generic [ref=e20]:
    - generic [ref=e22]:
      - img "ELBOLD" [ref=e24]
      - paragraph [ref=e25]: ELBOLD
      - paragraph [ref=e26]: Events
      - heading "Extraordinary celebrations start here." [level=2] [ref=e27]
      - paragraph [ref=e28]: The UK's premium marketplace for trusted event vendors.
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: ★
          - generic [ref=e32]: Verified vendors
        - generic [ref=e33]:
          - generic [ref=e34]: ★
          - generic [ref=e35]: Stripe-secured payments
        - generic [ref=e36]:
          - generic [ref=e37]: ★
          - generic [ref=e38]: Full dispute protection
    - generic [ref=e40]:
      - generic [ref=e41]:
        - heading "Welcome back" [level=1] [ref=e42]
        - paragraph [ref=e43]: Sign in to your account
      - generic [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]: Email
          - generic [ref=e47]:
            - img
            - textbox "Email" [ref=e48]:
              - /placeholder: you@email.com
        - generic [ref=e49]:
          - generic [ref=e50]: Password
          - generic [ref=e51]:
            - img
            - textbox "Password" [ref=e52]:
              - /placeholder: ••••••••
            - button [ref=e53]:
              - img [ref=e54]
        - button "Sign In" [ref=e57] [cursor=pointer]:
          - text: Sign In
          - img [ref=e58]
      - paragraph [ref=e60]:
        - text: Don't have an account?
        - link "Create one free" [ref=e61] [cursor=pointer]:
          - /url: /signup
      - generic [ref=e62]:
        - paragraph [ref=e63]: Test accounts
        - generic [ref=e64]:
          - paragraph [ref=e65]: "Customer: emily.carter@elbold.demo"
          - paragraph [ref=e66]: "Vendor: james.bennett@elbold.demo"
          - paragraph [ref=e67]: "Password: ElboldDemo2026!"
  - dialog "Cookie consent":
    - generic [ref=e68]:
      - generic [ref=e69]:
        - img [ref=e71]
        - generic [ref=e73]:
          - paragraph [ref=e74]: We use cookies
          - paragraph [ref=e75]:
            - text: We use essential cookies to keep the platform working and, with your consent, optional analytics cookies to improve your experience. We never use advertising cookies.
            - link "Cookie Policy" [ref=e76] [cursor=pointer]:
              - /url: /cookies
        - button "Dismiss and accept necessary cookies only" [ref=e77]:
          - img [ref=e78]
      - generic [ref=e81]:
        - button "Necessary only" [ref=e82]
        - button "Accept all" [ref=e83]
  - alert [ref=e84]
```

# Test source

```ts
  1  | import { Page } from "@playwright/test";
  2  | 
  3  | // Deterministic demo accounts from TESTER_GUIDE.md
  4  | // Passwords are set via /api/auth/create-demo-users in global setup
  5  | export const ACCOUNTS = {
  6  |   customer: {
  7  |     email: "emily.carter@elbold.demo",
  8  |     password: "ElboldDemo2026!",
  9  |     name: "Emily Carter",
  10 |   },
  11 |   customer2: {
  12 |     email: "oliver.webb@elbold.demo",
  13 |     password: "ElboldDemo2026!",
  14 |     name: "Oliver Webb",
  15 |   },
  16 |   vendor: {
  17 |     email: "james.bennett@elbold.demo",
  18 |     password: "ElboldDemo2026!",
  19 |     name: "James Bennett",
  20 |     business: "Bennett Visuals",
  21 |   },
  22 |   vendor2: {
  23 |     email: "sofia.martinez@elbold.demo",
  24 |     password: "ElboldDemo2026!",
  25 |     name: "Sofia Martinez",
  26 |     business: "Sofia Blooms",
  27 |   },
  28 |   // vendor3 — approved, level 1, no social/availability → score 63 "Almost Ready"
  29 |   vendor3: {
  30 |     email: "ravi.patel@elbold.demo",
  31 |     password: "ElboldDemo2026!",
  32 |     name: "Ravi Patel",
  33 |     business: "Spice & Grace Catering",
  34 |   },
  35 |   // vendor4 — approved, level 0, no verification → score 59, not marketplace-ready
  36 |   vendor4: {
  37 |     email: "charlotte.hughes@elbold.demo",
  38 |     password: "ElboldDemo2026!",
  39 |     name: "Charlotte Hughes",
  40 |     business: "Charlotte DJ Services",
  41 |   },
  42 |   // vendor5 — suspended after seed run → "Account Suspended" onboarding state
  43 |   vendor5: {
  44 |     email: "marcus.thompson@elbold.demo",
  45 |     password: "ElboldDemo2026!",
  46 |     name: "Marcus Thompson",
  47 |     business: "Marcus Events Decor",
  48 |   },
  49 |   admin: {
  50 |     email: "admin@elbold.demo",
  51 |     password: "ElboldDemo2026!",
  52 |   },
  53 | };
  54 | 
  55 | export async function loginAs(
  56 |   page: Page,
  57 |   role: keyof typeof ACCOUNTS
  58 | ): Promise<void> {
  59 |   const account = ACCOUNTS[role];
  60 |   await page.goto("/login");
  61 | 
  62 |   // Use data-testid — login form labels have no htmlFor associations
  63 |   await page.getByTestId("email-input").fill(account.email);
  64 |   await page.getByTestId("password-input").fill(account.password);
  65 |   await page.getByRole("button", { name: "Sign In" }).click();
  66 | 
  67 |   // Wait for post-login navigation (any dashboard)
> 68 |   await page.waitForURL(/\/(dashboard|vendor\/dashboard|admin)/, {
     |              ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  69 |     timeout: 20000,
  70 |   });
  71 | }
  72 | 
  73 | export async function logout(page: Page): Promise<void> {
  74 |   // Clear browser cookies — most reliable way to sign out in tests
  75 |   // (avoids depending on the signout API redirect URL being correct)
  76 |   await page.context().clearCookies();
  77 |   await page.goto("/login");
  78 | }
  79 | 
  80 | export async function expectRedirectToLogin(
  81 |   page: Page,
  82 |   protectedPath: string
  83 | ): Promise<void> {
  84 |   await page.goto(protectedPath);
  85 |   await page.waitForURL(/\/login/, { timeout: 10000 });
  86 | }
  87 | 
```