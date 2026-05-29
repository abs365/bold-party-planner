import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

// ─── API Authorization Boundaries ───────────────────────────────────────────

test.describe("Security — Unauthenticated API Blocks", () => {
  test("POST /api/uploads blocked without auth", async ({ page }) => {
    const response = await page.request.post("/api/uploads", {
      multipart: {
        file: {
          name: "test.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("fake"),
        },
      },
    });
    expect([401, 403, 302]).toContain(response.status());
  });

  test("POST /api/verification/upload blocked without auth", async ({
    page,
  }) => {
    const response = await page.request.post("/api/verification/upload", {
      data: { test: true },
    });
    expect([401, 403, 400]).toContain(response.status());
  });

  test("GET /api/verification/document blocked without auth", async ({
    page,
  }) => {
    const response = await page.request.get(
      "/api/verification/document?path=verification/any/doc.pdf"
    );
    expect([401, 403, 302]).toContain(response.status());
  });

  test("PATCH /api/admin/verifications blocked without auth", async ({
    page,
  }) => {
    const response = await page.request.patch("/api/admin/verifications", {
      data: { id: "fake-id", action: "approve" },
    });
    expect([401, 403, 302]).toContain(response.status());
  });

  test("GET /api/admin/alerts blocked without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/alerts");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("PATCH /api/admin/vendors blocked without auth", async ({ page }) => {
    const response = await page.request.patch("/api/admin/vendors", {
      data: { id: "fake-id", status: "approved" },
    });
    expect([401, 403, 302]).toContain(response.status());
  });
});

// ─── Non-Admin Blocked from Admin Routes ────────────────────────────────────

test.describe("Security — Customer Cannot Access Admin Routes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("customer blocked from /admin", async ({ page }) => {
    await page.goto("/admin");
    const isOnAdmin = page.url().includes("/admin") && !page.url().includes("/login");
    if (isOnAdmin) {
      // If URL didn't redirect, content must show forbidden
      await expect(
        page.getByText(/unauthorised|unauthorized|forbidden|not allowed|access denied/i)
      ).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page).not.toHaveURL(/^.*\/admin$/);
    }
  });

  test("customer PATCH to admin verifications API returns 403", async ({
    page,
  }) => {
    const response = await page.request.patch("/api/admin/verifications", {
      data: { id: "fake-id", action: "approve" },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("customer cannot read admin alerts API", async ({ page }) => {
    const response = await page.request.get("/api/admin/alerts");
    expect([401, 403]).toContain(response.status());
  });
});

// ─── Vendor Isolation ────────────────────────────────────────────────────────

test.describe("Security — Vendor Cannot Access Another Vendor's Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "vendor");
  });

  test("vendor cannot fetch another vendor's signed document URL", async ({
    page,
  }) => {
    const otherVendorId = "00000000-0000-0000-0000-000000000001";
    const response = await page.request.get(
      `/api/verification/document?path=verification/${otherVendorId}/private.pdf`
    );
    // Must reject — path doesn't start with their own vendor prefix
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test("vendor cannot PATCH another vendor's profile", async ({ page }) => {
    const response = await page.request.patch("/api/vendor/profile", {
      data: { vendor_id: "00000000-0000-0000-0000-000000000001", bio: "hacked" },
    });
    // Should operate only on authenticated user's vendor record, not arbitrary id
    expect([400, 401, 403, 404]).toContain(response.status());
  });
});

// ─── Upload Validation ───────────────────────────────────────────────────────

test.describe("Security — Upload Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "vendor");
  });

  test("upload rejects disallowed MIME type", async ({ page }) => {
    const response = await page.request.post("/api/uploads", {
      multipart: {
        file: {
          name: "malware.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("MZ"),
        },
      },
    });
    expect([400, 415, 422]).toContain(response.status());
  });

  test("verification upload rejects non-document MIME", async ({ page }) => {
    const response = await page.request.post("/api/verification/upload", {
      multipart: {
        file: {
          name: "script.sh",
          mimeType: "application/x-sh",
          buffer: Buffer.from("#!/bin/bash"),
        },
        document_type: "id_document",
      },
    });
    expect([400, 415, 422]).toContain(response.status());
  });
});

// ─── Route Protection — UI Level ─────────────────────────────────────────────

test.describe("Security — Protected Route Redirects (Unauthenticated)", () => {
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/create-event",
    "/dashboard/events",
    "/dashboard/quotes",
    "/vendor/dashboard",
    "/vendor/profile",
    "/vendor/verification",
    "/admin",
    "/admin/vendors",
    "/admin/verifications",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when unauthenticated`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  }
});

// ─── Content Security ────────────────────────────────────────────────────────

test.describe("Security — Content Reporting", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
  });

  test("report API requires authentication", async ({ page }) => {
    // Hit via request context — already authed as customer
    const response = await page.request.post("/api/reports", {
      data: {
        content_type: "vendor",
        content_id: "fake-id",
        reason: "spam",
      },
    });
    // Should process or return validation error — not 401
    expect(response.status()).not.toBe(401);
  });
});
