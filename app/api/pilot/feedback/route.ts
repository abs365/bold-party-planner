import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const vendorSchema = z.object({
  type:             z.literal("vendor"),
  q_onboarding:     z.number().int().min(1).max(5),
  q_verification:   z.number().int().min(1).max(5),
  q_quoting:        z.number().int().min(1).max(5),
  q_recommend:      z.number().int().min(1).max(5),
  missing_features: z.string().max(2000).optional(),
  additional_comments: z.string().max(2000).optional(),
});

const customerSchema = z.object({
  type:              z.literal("customer"),
  q_finding_vendors: z.number().int().min(1).max(5),
  q_requesting:      z.number().int().min(1).max(5),
  q_comparing:       z.number().int().min(1).max(5),
  q_trust:           z.number().int().min(1).max(5),
  q_use_again:       z.number().int().min(1).max(5),
  additional_comments: z.string().max(2000).optional(),
});

const schema = z.discriminatedUnion("type", [vendorSchema, customerSchema]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const db = await createAdminClient();
  const { error } = await db.from("pilot_feedback").insert({ ...parsed.data, user_id: user.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Admin-only: read all feedback
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!ADMIN_EMAILS.includes(user.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await createAdminClient();
  const { data, error } = await db
    .from("pilot_feedback")
    .select("*, profile:profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
