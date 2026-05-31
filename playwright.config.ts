import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global.setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      testMatch: "**/mobile.spec.ts",
    },
  ],
  outputDir: "test-results",
  webServer: {
    // CI: serve the pre-built production artifact (fast, no compilation)
    // Local: start Turbopack dev server
    command: process.env.CI ? "npm start" : "npm run dev",
    url: "http://localhost:3000",
    // Never reuse — stale Turbopack chunk-hash causes 404s in dev; not needed in prod mode
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60_000 : 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
