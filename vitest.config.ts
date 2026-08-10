// Minimal Vitest config for pure-function unit tests (co-located *.test.ts
// files, e.g. lib/finance/commission.test.ts). Deliberately separate from
// tests/ which is Playwright's real-browser e2e suite (see playwright.config.ts) —
// unit tests here run in Node with no server, no browser, and no database.
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "tests", ".next"],
  },
});
