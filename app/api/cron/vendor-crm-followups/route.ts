import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logContactActivity } from "@/lib/vendor/contact-activity";
import { isPaidPlan } from "@/lib/vendor/entitlements";

// Daily reminder for vendors with a manual_contacts follow-up date that has
// passed. Runs once daily (see vercel.json) so it naturally sends at most
// one reminder per contact per day for as long as the follow-up stays
// overdue - no extra dedup bookkeeping needed, matching the existing
// governance/reminders crons which are idempotent by construction.
//
// Automatic reminders are a paid-plan perk (Priority 5, contextual
// subscription value) - Free vendors can still track stage/follow_up_at
// manually and see overdue items in the CRM UI, they just don't get pushed
// a notification. The ContactListView banner surfaces this contextually.
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = new Date().toISOString();
  let sent = 0;
  let skippedFreePlan = 0;

  const { data: overdueContacts, error } = await supabase
    .from("manual_contacts")
    .select("id, display_name, vendor_id, follow_up_at, vendors!inner(user_id, subscription_plan)")
    .eq("is_archived", false)
    .not("follow_up_at", "is", null)
    .lte("follow_up_at", now)
    .not("stage", "in", '("won","lost")');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const contact of overdueContacts ?? []) {
    const vendorInfo = contact.vendors as unknown as { user_id: string; subscription_plan: string | null };

    if (!isPaidPlan(vendorInfo.subscription_plan)) { skippedFreePlan++; continue; }

    const vendorUserId = vendorInfo.user_id;

    await supabase.rpc("notify_user", {
      p_user_id: vendorUserId,
      p_title: "Follow-up due",
      p_message: `You set a reminder to follow up with ${contact.display_name}.`,
      p_type: "reminder",
      p_link: `/vendor/contacts/${contact.id}`,
    });

    await supabase.from("automation_logs").insert({
      type: "crm_follow_up_reminder",
      target_id: contact.id,
      target_type: "manual_contact",
      result: "sent",
    });

    void logContactActivity({
      vendorId: contact.vendor_id,
      manualContactId: contact.id,
      eventType: "follow_up_reminder_sent",
      description: "Follow-up reminder sent",
      actor: "system",
    });

    sent++;
  }

  return NextResponse.json({ success: true, remindersSent: sent, skippedFreePlan });
}
