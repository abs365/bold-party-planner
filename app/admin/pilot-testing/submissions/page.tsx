import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SubmissionsView } from "@/components/pilot/SubmissionsView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function PilotSubmissionsPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  const { data: submissions } = await db
    .from("pilot_test_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(500);

  return (
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Submissions</h1>
          <p className="text-slate-400 text-sm mt-1">All pilot tester submissions: filter, search, and export.</p>
        </div>
        <SubmissionsView submissions={(submissions ?? []) as Parameters<typeof SubmissionsView>[0]["submissions"]} />
      </div>
    </DashboardLayout>
  );
}
