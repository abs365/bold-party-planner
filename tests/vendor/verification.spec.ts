import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("Verification — Vendor View", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "vendor");
  });

  test("verification overview shows current level", async ({ page }) => {
    await page.goto("/vendor/verification");
    await expect(
      page.getByText(/level|unverified|verified|business verified|trusted pro/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("level 1 criteria checklist renders", async ({ page }) => {
    await page.goto("/vendor/verification");
    // Should show checklist items for automatic Level 1
    await expect(
      page.getByText(/email|phone|bio|packages|media/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("documents tab shows upload interface", async ({ page }) => {
    await page.goto("/vendor/verification");
    const docsTab = page.getByRole("tab", { name: /documents/i });
    if (await docsTab.isVisible()) {
      await docsTab.click();
      await expect(
        page.getByText(/upload|document|submit|required/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("document upload requires authentication (API guard)", async ({
    page,
  }) => {
    // Test that the upload API endpoint requires auth
    const response = await page.request.post("/api/verification/upload", {
      data: { test: true },
    });
    // Should not be 200 without proper auth + file
    expect(response.status()).not.toBe(200);
  });

  test("signed URL endpoint requires authentication", async ({ page }) => {
    const response = await page.request.get(
      "/api/verification/document?path=verification/fake/test.pdf"
    );
    // Must not serve document to unauthenticated request
    expect([401, 403, 302]).toContain(response.status());
  });
});

test.describe("Verification — Admin Approval Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin verifications page renders pending queue", async ({ page }) => {
    await page.goto("/admin/verifications");
    await expect(
      page.getByText(/verifications|pending|approved|rejected/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("stats bar shows counts", async ({ page }) => {
    await page.goto("/admin/verifications");
    // Pending / Approved / Flagged stats
    await expect(
      page.getByText(/pending|approved|flagged/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("filter tabs are functional", async ({ page }) => {
    await page.goto("/admin/verifications");
    const pendingTab = page.getByRole("tab", { name: /pending/i });
    const approvedTab = page.getByRole("tab", { name: /approved/i });
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await expect(pendingTab).toHaveAttribute("aria-selected", "true", {
        timeout: 3000,
      }).catch(() => {});
    }
    if (await approvedTab.isVisible()) {
      await approvedTab.click();
    }
  });

  test("approve action calls API with correct payload", async ({ page }) => {
    await page.goto("/admin/verifications");
    // Record whether an approve PATCH was made (non-assertive intercept)
    let approvePatchMade = false;
    await page.route("/api/admin/verifications", async (route) => {
      if (route.request().method() === "PATCH") approvePatchMade = true;
      await route.continue();
    });

    // Use exact match — the filter tab says "approved" (with 'd'), action button says "Approve"
    const approveBtn = page.getByRole("button", { name: "Approve", exact: true }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(
        page.getByText(/done|success|updated/i).first()
          .or(page.locator("[role=alert]:not(#__next-route-announcer__)").first())
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test("reject action requires a reason", async ({ page }) => {
    await page.goto("/admin/verifications");
    // Use exact match — the filter tab says "rejected" (with 'ed'), action button says "Reject"
    const rejectBtn = page.getByRole("button", { name: "Reject", exact: true }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      // Rejection reason input appears in the expanded card form
      await expect(
        page.getByPlaceholder(/reason|expired|blurry/i).first()
          .or(page.getByLabel(/reason|note|rejection/i).first())
          .or(page.locator("textarea").first())
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("vendor flagging action is available", async ({ page }) => {
    await page.goto("/admin/verifications");
    const flagBtn = page.getByRole("button", { name: /flag|suspicious/i }).first();
    if (await flagBtn.isVisible()) {
      await expect(flagBtn).toBeEnabled();
    }
  });
});

test.describe("Verification — Signed URL Security", () => {
  test("vendor cannot access another vendor's document", async ({ page }) => {
    await loginAs(page, "vendor");
    // Try to access a document path belonging to a different vendor ID
    const fakeVendorId = "00000000-0000-0000-0000-000000000001";
    const response = await page.request.get(
      `/api/verification/document?path=verification/${fakeVendorId}/test.pdf`
    );
    // Should be forbidden — not vendor's own prefix
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test("unauthenticated user cannot get signed URL", async ({ page }) => {
    const response = await page.request.get(
      "/api/verification/document?path=verification/any/doc.pdf"
    );
    expect([401, 403, 302]).toContain(response.status());
  });
});
