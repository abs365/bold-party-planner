import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDisputesView } from "@/components/admin/AdminDisputesView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const adminClient = await createAdminClient();
  const { data: disputes } = await adminClient
    .from("disputes")
    .select(`
      *,
      booking:bookings(id, total_amount, event:events(title, date)),
      customer:profiles(id, full_name, email),
      vendor:vendors(id, business_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Dispute Management</h1>
          <p className="text-white/60 mt-1">Review and resolve customer-vendor disputes</p>
        </div>
        <AdminDisputesView disputes={disputes ?? []} />
      </div>
    </DashboardLayout>
  );
}
