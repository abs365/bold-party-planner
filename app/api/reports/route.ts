import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  content_type: z.enum(["vendor_media", "review", "vendor", "message"]),
  content_id: z.string().uuid(),
  vendor_id: z.string().uuid().optional(),
  reason: z.enum(["inappropriate", "spam", "misleading", "offensive", "copyright", "other"]),
  details: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Prevent duplicate reports from same user for same content
  const { data: existing } = await supabase
    .from("content_reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("content_type", parsed.data.content_type)
    .eq("content_id", parsed.data.content_id)
    .eq("status", "open")
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "You have already reported this content" }, { status: 409 });

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    ...parsed.data,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
