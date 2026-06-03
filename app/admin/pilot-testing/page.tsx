import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LaunchReadinessDashboard } from "@/components/pilot/LaunchReadinessDashboard";
import { assertAdminPage } from "@/lib/admin";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function PilotTestingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  await assertAdminPage();

  const db = await createAdminClient();
  const [submissionsRes, bugsRes] = await Promise.all([
    db.from("pilot_test_submissions").select("*").order("submitted_at", { ascending: false }).limit(500),
    db.from("pilot_bug_reports").select("severity, status").limit(1000),
  ]);

  const submissions = submissionsRes.data ?? [];
  const bugs = bugsRes.data ?? [];

  const bugCount = {
    critical: bugs.filter((b) => b.severity === "critical").length,
    high:     bugs.filter((b) => b.severity === "high").length,
    medium:   bugs.filter((b) => b.severity === "medium").length,
    low:      bugs.filter((b) => b.severity === "low").length,
    total:    bugs.length,
  };

  return (
    <DashboardLayout user={profile as Profile}>
      <LaunchReadinessDashboard
        submissions={submissions as Parameters<typeof LaunchReadinessDashboard>[0]["submissions"]}
        bugCount={bugCount}
      />
    </DashboardLayout>
  );
}
