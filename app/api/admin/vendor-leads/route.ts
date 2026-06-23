import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { scoreLead } from "@/lib/vendor-acquisition/scoring";

export async function GET(req: NextRequest) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(req.url);

  let query = auth.db.from("vendor_leads").select("*");

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
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

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

  const { data, error } = await auth.db.from("vendor_leads").insert({
    ...body,
    lead_score: scoreResult.total,
    priority:   scoreResult.priority,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data }, { status: 201 });
}
