import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SubmissionsView } from "@/components/pilot/SubmissionsView";
import { assertAdminPage } from "@/lib/admin";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function PilotSubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  await assertAdminPage();

  const db = await createAdminClient();
  const { data: submissions } = await db
    .from("pilot_test_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(500);

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Submissions</h1>
          <p className="text-slate-400 text-sm mt-1">All pilot tester submissions — filter, search, and export.</p>
        </div>
        <SubmissionsView submissions={(submissions ?? []) as Parameters<typeof SubmissionsView>[0]["submissions"]} />
      </div>
    </DashboardLayout>
  );
}
