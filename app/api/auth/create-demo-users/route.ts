import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/create-demo-users
 *
 * Creates test accounts using the Supabase Admin API so passwords work correctly.
 * Protected by a secret key. Run once after seeding the database.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/auth/create-demo-users \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"BOLD_PARTY_DEMO_2026"}'
 */

const DEMO_SECRET = "BOLD_PARTY_DEMO_2026";
const DEMO_PASSWORD = "BoldPartyDemo2026!";

const DEMO_USERS = [
  { id: "a0000001-0000-0000-0000-000000000001", email: "james.bennett@boldparty.demo", name: "James Bennett", role: "vendor" },
  { id: "a0000002-0000-0000-0000-000000000002", email: "sofia.martinez@boldparty.demo", name: "Sofia Martinez", role: "vendor" },
  { id: "a0000003-0000-0000-0000-000000000003", email: "ravi.patel@boldparty.demo", name: "Ravi Patel", role: "vendor" },
  { id: "a0000004-0000-0000-0000-000000000004", email: "charlotte.hughes@boldparty.demo", name: "Charlotte Hughes", role: "vendor" },
  { id: "a0000005-0000-0000-0000-000000000005", email: "marcus.thompson@boldparty.demo", name: "Marcus Thompson", role: "vendor" },
  { id: "b0000001-0000-0000-0000-000000000001", email: "emily.carter@boldparty.demo", name: "Emily Carter", role: "customer" },
  { id: "b0000002-0000-0000-0000-000000000002", email: "oliver.webb@boldparty.demo", name: "Oliver Webb", role: "customer" },
  { id: "b0000003-0000-0000-0000-000000000003", email: "priya.singh@boldparty.demo", name: "Priya Singh", role: "customer" },
];

export async function POST(request: Request) {
  try {
    const body = await request.json() as { secret?: string };
    if (body.secret !== DEMO_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of DEMO_USERS) {
      try {
        // Try to update password if user exists, or create them
        const { data: existing } = await supabase.auth.admin.getUserById(user.id);

        if (existing.user) {
          // User exists (from seed SQL) — update their password to a working one
          const { error } = await supabase.auth.admin.updateUserById(user.id, {
            password: DEMO_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: user.name, role: user.role },
          });
          results.push({ email: user.email, status: error ? "update_failed" : "updated", error: error?.message });
        } else {
          // Create the user fresh
          const { error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: DEMO_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: user.name, role: user.role },
          });
          results.push({ email: user.email, status: error ? "create_failed" : "created", error: error?.message });
        }
      } catch (err) {
        results.push({ email: user.email, status: "error", error: String(err) });
      }
    }

    const allOk = results.every((r) => !r.status.includes("failed") && r.status !== "error");

    return NextResponse.json({
      success: allOk,
      password: DEMO_PASSWORD,
      results,
      message: allOk
        ? "All demo users are ready. Use the password above to log in."
        : "Some users had issues. Check results for details.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Request failed", details: String(err) }, { status: 500 });
  }
}
