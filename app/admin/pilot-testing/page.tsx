import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LaunchReadinessDashboard } from "@/components/pilot/LaunchReadinessDashboard";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function PilotTestingPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
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
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
      <LaunchReadinessDashboard
        submissions={submissions as Parameters<typeof LaunchReadinessDashboard>[0]["submissions"]}
        bugCount={bugCount}
      />
    </DashboardLayout>
  );
}
