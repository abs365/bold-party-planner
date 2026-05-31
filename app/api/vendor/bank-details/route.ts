import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  account_name:   z.string().min(2).max(100),
  sort_code:      z.string().regex(/^\d{2}-?\d{2}-?\d{2}$/, "Sort code must be in format 12-34-56"),
  account_number: z.string().regex(/^\d{6,8}$/, "Account number must be 6–8 digits"),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "No vendor account" }, { status: 403 });

  const { data } = await supabase.from("vendor_bank_details").select("*").eq("vendor_id", vendor.id).maybeSingle();
  return NextResponse.json(data ?? null);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "No vendor account" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Normalise sort code to XX-XX-XX format
  const sortCode = parsed.data.sort_code.replace(/\D/g, "").replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3");

  const db = await createAdminClient();
  const { data, error } = await db
    .from("vendor_bank_details")
    .upsert(
      { vendor_id: vendor.id, ...parsed.data, sort_code: sortCode },
      { onConflict: "vendor_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
