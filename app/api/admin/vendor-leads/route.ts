import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { scoreLead } from "@/lib/vendor-acquisition/scoring";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await createAdminClient();
  const { searchParams } = new URL(req.url);

  let query = db.from("vendor_leads").select("*");

  const status   = searchParams.get("status");
  const category = searchParams.get("category");
  const region   = searchParams.get("region");
  const priority = searchParams.get("priority");
  const search   = searchParams.get("search");

  if (status)   query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (region)   query = query.eq("region", region);
  if (priority) query = query.eq("priority", priority);
  if (search)   query = query.ilike("business_name", `%${search}%`);

  const { data, error } = await query.order("lead_score", { ascending: false }).order("created_at", { ascending: false }).limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

export async function POST(req: NextRequest) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await createAdminClient();
  const body = await req.json();

  const scoreResult = scoreLead({
    region:       body.region       ?? null,
    category:     body.category     ?? null,
    website:      body.website      ?? null,
    instagram:    body.instagram    ?? null,
    facebook:     body.facebook     ?? null,
    email:        body.email        ?? null,
    phone:        body.phone        ?? null,
    rating:       body.rating       ?? null,
    review_count: body.review_count ?? null,
  });

  const { data, error } = await db.from("vendor_leads").insert({
    ...body,
    lead_score: scoreResult.total,
    priority:   scoreResult.priority,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data }, { status: 201 });
}
