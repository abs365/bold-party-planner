import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reportSchema = z.object({
  review_id: z.string().uuid(),
  reason:    z.enum(["fake", "spam", "offensive", "irrelevant", "conflict_of_interest", "other"]),
  details:   z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { review_id, reason, details } = parsed.data;

    // Verify the review exists and is approved
    const { data: review } = await supabase
      .from("reviews")
      .select("id, moderation_status")
      .eq("id", review_id)
      .eq("moderation_status", "approved")
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("review_reports")
      .insert({ review_id, reporter_id: user.id, reason, details: details ?? null });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already reported" }, { status: 409 });
      }
      throw error;
    }

    // Auto-flag review if it already has 3+ open reports
    const { count } = await supabase
      .from("review_reports")
      .select("id", { count: "exact", head: true })
      .eq("review_id", review_id)
      .eq("status", "open");

    if ((count ?? 0) >= 3) {
      await supabase
        .from("reviews")
        .update({ moderation_status: "flagged" })
        .eq("id", review_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Review report error:", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
