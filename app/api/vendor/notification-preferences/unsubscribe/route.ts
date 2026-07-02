import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const KNOWN_TYPES: Record<string, string> = {
  daily_summary: "daily_summary_email",
};

// One-click, no-login unsubscribe link embedded in outbound emails. Scoped
// to a single notification type per link (never "disable everything"), and
// the only side effect is turning a boolean off - low-risk enough to not
// require authentication, matching standard email unsubscribe-link practice.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor");
  const type = searchParams.get("type");

  const column = type ? KNOWN_TYPES[type] : undefined;
  if (!vendorId || !column) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  const db = await createAdminClient();
  await db
    .from("vendor_notification_preferences")
    .upsert({ vendor_id: vendorId, [column]: false }, { onConflict: "vendor_id" });

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px">
      <h2>You've been unsubscribed</h2>
      <p>You won't receive this email again. You can re-enable it any time from your dashboard settings.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com"}/vendor/dashboard">Back to dashboard</a>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
