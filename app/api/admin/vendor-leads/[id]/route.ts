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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = await createAdminClient();
  const body = await req.json();

  // Rescore if any scoring-relevant field changed
  const scoreFields = ["region", "category", "website", "instagram", "facebook", "email", "phone", "rating", "review_count"];
  const needsRescore = scoreFields.some((f) => f in body);

  let patch = { ...body };
  if (needsRescore) {
    const { data: existing } = await db.from("vendor_leads").select("*").eq("id", id).single();
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

  const { data, error } = await db.from("vendor_leads").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = await createAdminClient();
  const { error } = await db.from("vendor_leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
