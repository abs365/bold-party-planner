import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// WP-C5 (REG-20): allowlist matching VendorSharePanel's own channel tags -
// anything else is dropped rather than stored, since this is attribution
// data a founder will read later, not free-form client input worth trusting.
const KNOWN_REFS = new Set(["share", "qr", "whatsapp", "facebook", "linkedin"]);

export async function POST(req: Request) {
  try {
    const { vendor_id, ref } = await req.json() as { vendor_id?: string; ref?: string };
    if (!vendor_id) {
      return NextResponse.json({ error: "Missing vendor_id" }, { status: 400 });
    }
    const safeRef = ref && KNOWN_REFS.has(ref) ? ref : null;

    const adminDb = await createAdminClient();
    await adminDb.rpc("increment_vendor_profile_views", { p_vendor_id: vendor_id, p_ref: safeRef });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
