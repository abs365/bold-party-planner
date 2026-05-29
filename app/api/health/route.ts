import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "degraded" | "error";

interface Check {
  status: CheckStatus;
  latencyMs?: number;
  detail?: string;
}

export async function GET() {
  const checks: Record<string, Check> = {};
  let overall: CheckStatus = "ok";

  const degrade = (level: CheckStatus) => {
    if (level === "error") overall = "error";
    else if (level === "degraded" && overall === "ok") overall = "degraded";
  };

  // ── 1. Database connectivity ───────────────────────────────────────────────
  const dbStart = performance.now();
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    const latencyMs = Math.round(performance.now() - dbStart);
    if (error) {
      checks.database = { status: "error", latencyMs, detail: error.message };
      degrade("error");
    } else {
      checks.database = { status: "ok", latencyMs };
    }
  } catch (err) {
    checks.database = { status: "error", latencyMs: Math.round(performance.now() - dbStart), detail: String(err) };
    degrade("error");
  }

  // ── 2. Auth service (Supabase GoTrue) ──────────────────────────────────────
  const authStart = performance.now();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
        signal: AbortSignal.timeout(5000),
      }
    );
    const latencyMs = Math.round(performance.now() - authStart);
    checks.auth = res.ok
      ? { status: "ok", latencyMs }
      : { status: "degraded", latencyMs, detail: `HTTP ${res.status}` };
    if (!res.ok) degrade("degraded");
  } catch {
    checks.auth = { status: "degraded", detail: "unreachable" };
    degrade("degraded");
  }

  // ── 3. Storage (Supabase Storage) ──────────────────────────────────────────
  const storageStart = performance.now();
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.storage.listBuckets();
    const latencyMs = Math.round(performance.now() - storageStart);
    if (error) {
      checks.storage = { status: "degraded", latencyMs, detail: error.message };
      degrade("degraded");
    } else {
      checks.storage = { status: "ok", latencyMs };
    }
  } catch (err) {
    checks.storage = { status: "degraded", detail: String(err) };
    degrade("degraded");
  }

  // ── 4. Environment sanity ──────────────────────────────────────────────────
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missingEnv = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingEnv.length > 0) {
    checks.environment = { status: "error", detail: `Missing: ${missingEnv.join(", ")}` };
    degrade("error");
  } else {
    checks.environment = { status: "ok" };
  }

  const httpStatus: Record<CheckStatus, number> = { ok: 200, degraded: 200, error: 503 };

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime?.() ?? 0),
      checks,
    },
    {
      status: httpStatus[overall],
      headers: {
        "Cache-Control": "no-store",
        "X-Health-Status": overall,
      },
    }
  );
}
