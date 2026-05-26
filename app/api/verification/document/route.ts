import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "verification-documents";
const SIGNED_URL_TTL = 3600; // 1 hour

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  if (!isAdmin) {
    // Vendor: path must start with verification/{ownVendorId}/
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 403 });

    const expectedPrefix = `verification/${vendor.id}/`;
    if (!path.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not generate signed URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL });
}
