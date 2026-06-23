import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminBookingsView } from "@/components/admin/AdminBookingsView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const adminClient = auth.db;
  const { data: profile } = await adminClient.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const { data: bookings } = await adminClient
    .from("bookings")
    .select(`
      id, status, payment_status, total_amount, deposit_amount, commission_amount, created_at,
      customer:profiles(id, full_name, email),
      vendor:vendors(id, business_name),
      event:events(id, title, date)
    `)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">All Bookings</h1>
          <p className="text-white/60 mt-1">Monitor and manage all platform bookings</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AdminBookingsView bookings={(bookings ?? []) as any} />
      </div>
    </DashboardLayout>
  );
}
