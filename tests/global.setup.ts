import { request } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// All routes whose modules need to be compiled before tests run.
// Unauthenticated GETs are enough — Turbopack compiles the module on first hit.
const WARM_PAGES = [
  "/",
  "/login",
  "/signup",
  "/browse",
  // Protected routes redirect to /login but still trigger SSR module compilation
  "/dashboard",
  "/dashboard/create-event",
  "/dashboard/events",
  "/dashboard/quotes",
  "/dashboard/bookings",
  "/dashboard/messages",
  "/dashboard/saved",
  "/vendor/dashboard",
  "/vendor/profile",
  "/vendor/services",
  "/vendor/media",
  "/vendor/onboarding",
  "/vendor/verification",
  "/admin",
  "/admin/vendors",
  "/admin/customers",
  "/admin/moderation",
  "/admin/verifications",
];

async function warmPages(): Promise<void> {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const t = Date.now();
  console.log(`\n[global setup] Warming ${WARM_PAGES.length} pages (triggers Turbopack compilation)...`);

  await Promise.allSettled(
    WARM_PAGES.map((path) =>
      ctx.get(path, { timeout: 60_000 }).catch(() => {})
    )
  );

  await ctx.dispose();
  console.log(`[global setup] Warming done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}

export default async function globalSetup() {
  // Step 1: bootstrap demo users with correct passwords
  const ctx = await request.newContext({ baseURL: BASE_URL });
  try {
    const res = await ctx.post("/api/auth/create-demo-users", {
      data: { secret: "ELBOLD_DEMO_2026" },
      timeout: 30_000,
    });

    if (res.ok()) {
      const body = (await res.json()) as {
        success: boolean;
        message?: string;
        results?: { email: string; status: string; error?: string }[];
      };

      const statuses =
        body.results
          ?.map((r) => `${r.email.split("@")[0]}:${r.status}${r.error ? `(${r.error})` : ""}`)
          .join("\n  ") ?? "";
      console.log(
        `\n[global setup] Demo users: ${body.success ? "OK" : "PARTIAL"}\n  ${statuses}`
      );

      if (!body.success) {
        const failed = body.results?.filter(
          (r) => r.status !== "created" && r.status !== "already_exists" && r.status !== "created_id_mismatch"
        ) ?? [];
        if (failed.length > 0) {
          console.error(`
╔══════════════════════════════════════════════════════════════════════╗
║  DEMO USER CREATION FAILED — auth tests cannot pass                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  Check:                                                              ║
║    1. SUPABASE_SERVICE_ROLE_KEY is set correctly in .env.local       ║
║    2. The app is running and reachable at ${BASE_URL.padEnd(26)}║
║    3. Migration 017 is applied (handle_new_user ON CONFLICT fix)     ║
║                                                                      ║
║  Failed users:                                                       ║
${failed.map((r) => `║    ${`${r.email}: ${r.error ?? r.status}`.slice(0, 64).padEnd(64)}║`).join("\n")}
╚══════════════════════════════════════════════════════════════════════╝
`);
        }
        if (body.message) console.warn(`[global setup] ${body.message}`);
      }
    } else {
      const text = await res.text();
      console.warn(
        `\n[global setup] create-demo-users returned ${res.status()}: ${text.slice(0, 200)}`
      );
    }
  } catch (err) {
    console.warn(
      "\n[global setup] Could not bootstrap demo users:",
      (err as Error).message
    );
    console.warn(
      "[global setup] Run the app and POST /api/auth/create-demo-users manually if tests fail."
    );
  } finally {
    await ctx.dispose();
  }

  // Step 2: seed deterministic E2E data
  const seedCtx = await request.newContext({ baseURL: BASE_URL });
  try {
    const res = await seedCtx.post("/api/dev/seed-e2e", {
      data: { secret: "ELBOLD_SEED_2026" },
      timeout: 30_000,
    });

    if (res.ok()) {
      const body = (await res.json()) as { success: boolean; log?: string[]; errors?: string[]; message?: string };
      if (body.success) {
        console.log(`\n[global setup] E2E seed: OK\n  ${(body.log ?? []).join("\n  ")}`);
      } else {
        console.warn(`\n[global setup] E2E seed: PARTIAL\n  ${(body.errors ?? []).join("\n  ")}`);
      }
    } else {
      const text = await res.text();
      console.warn(`\n[global setup] seed-e2e returned ${res.status()}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("\n[global setup] Could not seed E2E data:", (err as Error).message);
  } finally {
    await seedCtx.dispose();
  }

  // Step 3: warm all pages to pre-compile Turbopack modules
  await warmPages();
}
