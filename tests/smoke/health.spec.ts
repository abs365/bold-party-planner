import { test, expect } from "@playwright/test";

// Smoke tests - run against any environment (local or staging)
// They test critical infrastructure with no login required.
// Run with: npx playwright test tests/smoke/ --project=chromium

test.describe("Smoke - Health & Infrastructure", () => {
  test("health endpoint returns ok or degraded (not error)", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json() as { status: string; checks: Record<string, unknown> };
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.auth).toBeDefined();
    expect(body.checks.environment).toBeDefined();
  });

  test("health endpoint has database check", async ({ request }) => {
    const res = await request.get("/api/health");
    const body = await res.json() as { checks: { database: { status: string } } };
    expect(body.checks.database.status).toMatch(/^(ok|degraded|error)$/);
  });

  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ELBOLD Events/i);
  });

  test("browse page loads without login", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    // Should not redirect to login
    expect(page.url()).not.toContain("/login");
  });

  test("robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect([200, 404]).toContain(res.status()); // 404 acceptable if not implemented
  });

  test("unauthenticated requests to protected APIs return 401", async ({ request }) => {
    const res = await request.get("/api/vendor/subscription");
    expect(res.status()).toBe(401);
  });

  test("admin API rejects unauthenticated requests", async ({ request }) => {
    const res = await request.get("/api/admin/monetization");
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("Smoke - Legal Pages", () => {
  const LEGAL_PAGES = [
    { path: "/privacy", title: "Privacy" },
    { path: "/terms", title: "Terms" },
    { path: "/vendor-terms", title: "Vendor" },
    { path: "/refunds", title: "Refund" },
    { path: "/cookies", title: "Cookie" },
    { path: "/community-guidelines", title: "Community" },
  ];

  for (const { path } of LEGAL_PAGES) {
    test(`${path} loads without error`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      const text = await page.locator("body").innerText();
      expect(text.length).toBeGreaterThan(500);
    });
  }
});

test.describe("Smoke - Stripe Webhook Endpoint", () => {
  test("webhook endpoint rejects requests without signature", async ({ request }) => {
    const res = await request.post("/api/payments/webhook", {
      data: "{}",
      headers: { "Content-Type": "application/json" },
    });
    // Should return 400 (missing signature) not 500
    expect(res.status()).toBe(400);
  });
});

test.describe("Smoke - GDPR APIs", () => {
  test("export API requires authentication", async ({ request }) => {
    const res = await request.get("/api/account/export");
    expect(res.status()).toBe(401);
  });

  test("delete API requires authentication", async ({ request }) => {
    const res = await request.post("/api/account/delete");
    expect(res.status()).toBe(401);
  });
});

test.describe("Smoke - Push Notifications Infrastructure", () => {
  test("service worker is served with correct content type", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toMatch(/javascript/);
  });

  test("service worker contains push event handler", async ({ request }) => {
    const res = await request.get("/sw.js");
    const body = await res.text();
    expect(body).toContain("push");
    expect(body).toContain("showNotification");
    expect(body).toContain("pushsubscriptionchange");
    expect(body).toContain("SET_VAPID_KEY");
  });

  test("service worker contains fixed pushsubscriptionchange with applicationServerKey", async ({ request }) => {
    const res = await request.get("/sw.js");
    const body = await res.text();
    expect(body).toContain("applicationServerKey");
    expect(body).toContain("urlBase64ToUint8Array");
  });

  test("push subscribe endpoint requires authentication", async ({ request }) => {
    const res = await request.post("/api/push/subscribe", {
      data: { endpoint: "https://test", keys: { p256dh: "test", auth: "test" } },
    });
    expect(res.status()).toBe(401);
  });

  test("push subscribe DELETE requires authentication", async ({ request }) => {
    const res = await request.delete("/api/push/subscribe", {
      data: { endpoint: "https://test" },
    });
    expect(res.status()).toBe(401);
  });

  test("push send endpoint requires admin authentication", async ({ request }) => {
    const res = await request.post("/api/push/send", {
      data: { userId: "test", title: "Test", body: "Test" },
    });
    expect(res.status()).toBe(401);
  });

  test("PWA manifest is served correctly", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/manifest\+json/);
    const body = await res.json() as { name: string; display: string };
    expect(body.name).toBe("ELBOLD Events");
    expect(body.display).toBe("standalone");
  });

  test("notifications page is accessible (auth redirect for unauthenticated)", async ({ request }) => {
    // The page requires auth; unauthenticated curl-style request hits the middleware
    const res = await request.get("/dashboard/notifications");
    // Either redirected (200 after redirect chain) or 307 redirect — either way not a 500
    expect([200, 307, 308]).toContain(res.status());
  });
});
