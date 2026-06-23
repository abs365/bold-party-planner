import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { scoreLead } from "@/lib/vendor-acquisition/scoring";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { id } = await params;
  const body = await req.json();

  const scoreFields = ["region", "category", "website", "instagram", "facebook", "email", "phone", "rating", "review_count"];
  const needsRescore = scoreFields.some((f) => f in body);

  let patch = { ...body };
  if (needsRescore) {
    const { data: existing } = await auth.db.from("vendor_leads").select("*").eq("id", id).single();
    if (existing) {
      const merged = { ...existing, ...body };
      const scoreResult = scoreLead({
        region:       merged.region       ?? null,
        category:     merged.category     ?? null,
        website:      merged.website      ?? null,
        instagram:    merged.instagram    ?? null,
        facebook:     merged.facebook     ?? null,
        email:        merged.email        ?? null,
        phone:        merged.phone        ?? null,
        rating:       merged.rating       ?? null,
        review_count: merged.review_count ?? null,
      });
      patch = { ...patch, lead_score: scoreResult.total, priority: scoreResult.priority };
    }
  }

  const { data, error } = await auth.db.from("vendor_leads").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { id } = await params;
  const { error } = await auth.db.from("vendor_leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
