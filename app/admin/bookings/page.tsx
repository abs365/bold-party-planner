import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminBookingsView } from "@/components/admin/AdminBookingsView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const adminClient = await createAdminClient();
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
    <DashboardLayout user={profile as Profile}>
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
