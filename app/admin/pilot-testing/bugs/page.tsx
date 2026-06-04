import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BugsView } from "@/components/pilot/BugsView";
import { assertAdminPage } from "@/lib/admin";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function PilotBugsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  await assertAdminPage();

  const db = await createAdminClient();
  const { data: bugs } = await db
    .from("pilot_bug_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bug Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Filter, investigate, and track all reported bugs through to resolution.</p>
        </div>
        <BugsView bugs={(bugs ?? []) as Parameters<typeof BugsView>[0]["bugs"]} />
      </div>
    </DashboardLayout>
  );
}
