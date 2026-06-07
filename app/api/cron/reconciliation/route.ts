import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Daily reconciliation cron — delegates to the admin reconciliation API
// so all logic, logging, and DB writes live in one place.
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? "";
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const response = await fetch(`${appUrl}/api/admin/reconciliation`, {
    headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
    cache: "no-store",
  });

  const result = await response.json() as Record<string, unknown>;
  console.log("[cron/reconciliation] completed:", result.status, "discrepancies:", result.discrepancies_found);

  return NextResponse.json({ ok: true, result });
}
