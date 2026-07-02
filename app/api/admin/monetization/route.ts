import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { computeCommercialMetrics } from "@/lib/vendor/commercial-metrics";

export async function GET(request: Request) {
  // Financial settings and MRR data — Global Admin minimum (Founder can change settings; Global Admin can view)
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const daysBack = parseInt(searchParams.get("days") ?? "30");

  const metrics = await computeCommercialMetrics(auth.db, daysBack);
  return NextResponse.json(metrics);
}
