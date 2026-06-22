import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { vendor_id } = await req.json() as { vendor_id?: string };
    if (!vendor_id) {
      return NextResponse.json({ error: "Missing vendor_id" }, { status: 400 });
    }

    const adminDb = await createAdminClient();
    await adminDb.rpc("increment_vendor_profile_views", { p_vendor_id: vendor_id });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
