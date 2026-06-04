import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPayoutsView } from "@/components/admin/AdminPayoutsView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const adminClient = await createAdminClient();
  const { data: payouts } = await adminClient
    .from("bookings")
    .select(`
      id, vendor_payout, commission_amount, total_amount, payment_status, status, created_at,
      vendor:vendors(id, business_name),
      event:events(id, title, date)
    `)
    .not("status", "in", '("cancelled")')
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Vendor Payouts</h1>
          <p className="text-white/60 mt-1">Track platform commission and vendor payout obligations</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AdminPayoutsView payouts={(payouts ?? []) as any} />
      </div>
    </DashboardLayout>
  );
}
