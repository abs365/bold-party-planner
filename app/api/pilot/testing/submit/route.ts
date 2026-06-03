import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit({ identifier: `pilot-submit:${ip}`, limit: 10, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const body = await request.json() as {
      test_type: string;
      tester_name: string;
      tester_email: string;
      rating: number;
      results: Record<string, unknown>;
      comments?: string;
      bug?: {
        title: string;
        description: string;
        page_url?: string;
        severity: string;
        screenshot_url?: string;
      } | null;
    };

    const { test_type, tester_name, tester_email, rating, results, comments, bug } = body;

    if (!test_type || !tester_name || !tester_email || !rating || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["customer", "vendor", "admin"].includes(test_type)) {
      return NextResponse.json({ error: "Invalid test_type" }, { status: 400 });
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json({ error: "Rating must be between 1 and 10" }, { status: 400 });
    }

    const bugCounts = { critical_bugs: 0, high_bugs: 0, medium_bugs: 0, low_bugs: 0 };
    if (bug?.severity === "critical") bugCounts.critical_bugs = 1;
    else if (bug?.severity === "high") bugCounts.high_bugs = 1;
    else if (bug?.severity === "medium") bugCounts.medium_bugs = 1;
    else if (bug?.severity === "low") bugCounts.low_bugs = 1;

    const db = await createAdminClient();

    const { data: submission, error: subError } = await db
      .from("pilot_test_submissions")
      .insert({
        test_type,
        tester_name: tester_name.trim(),
        tester_email: tester_email.toLowerCase().trim(),
        rating,
        results,
        comments: comments?.trim() || null,
        ...bugCounts,
      })
      .select()
      .single();

    if (subError) {
      logger.warn("pilot.submit.failed", { err: subError });
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    if (bug && bug.title && bug.description) {
      const { error: bugError } = await db.from("pilot_bug_reports").insert({
        reporter_name: tester_name.trim(),
        reporter_email: tester_email.toLowerCase().trim(),
        test_type,
        title: bug.title.trim(),
        description: bug.description.trim(),
        page_url: bug.page_url?.trim() || null,
        severity: bug.severity,
        screenshot_url: bug.screenshot_url?.trim() || null,
        submission_id: submission.id,
        status: "open",
      });

      if (bugError) {
        logger.warn("pilot.bug_report.failed", { submissionId: submission.id, err: bugError });
      }
    }

    logger.info("pilot.submit.success", { submissionId: submission.id, test_type });
    return NextResponse.json({ success: true, id: submission.id });
  } catch (err) {
    logger.error("pilot.submit.unexpected", { err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 }
    );
  }
}
