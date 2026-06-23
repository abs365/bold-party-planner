import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDisputesView } from "@/components/admin/AdminDisputesView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const adminClient = auth.db;
  const { data: profile } = await adminClient.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

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
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
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
