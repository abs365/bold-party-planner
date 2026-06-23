import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPayoutsQueue } from "@/components/admin/AdminPayoutsQueue";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const auth = await requireAdminRole("global_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  // Payouts from the vendor_payouts ledger, ordered by status so pending come first
  const { data: payouts } = await db
    .from("vendor_payouts")
    .select(`
      id, booking_id, vendor_id, amount, status, notes, created_at,
      booking:bookings(
        id, total_amount, commission_amount, vendor_payout, payment_status, status,
        event:events(title, date),
        customer:profiles!bookings_customer_id_fkey(full_name)
      ),
      vendor:vendors(id, business_name, city)
    `)
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  // Summary totals
  const allPayouts = payouts ?? [];
  const pendingTotal  = allPayouts.filter((p) => p.status === "scheduled" || p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const paidTotal     = allPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount  = allPayouts.filter((p) => p.status === "scheduled" || p.status === "pending").length;

  const adminProfile = profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() };

  return (
    <DashboardLayout user={adminProfile as Profile} adminRole={auth.role}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payout Queue</h1>
            <p className="text-white/60 mt-1 text-sm">
              Process vendor payouts within 7 working days of event completion
            </p>
          </div>
          <Link href="/admin" className="btn-secondary text-sm py-2">
            ← Admin
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Awaiting Payment", value: `£${pendingTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, count: `${pendingCount} payouts`, urgent: pendingCount > 0, color: "text-amber-400" },
            { label: "Total Paid Out", value: `£${paidTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, count: `${allPayouts.filter((p) => p.status === "paid").length} completed`, urgent: false, color: "text-emerald-400" },
            { label: "Total Records", value: String(allPayouts.length), count: "all time", urgent: false, color: "text-slate-400" },
          ].map(({ label, value, count, urgent, color }) => (
            <div
              key={label}
              className={`rounded-xl p-5 border ${urgent ? "bg-amber-500/8 border-amber-500/20" : "bg-white/4 border-white/6"}`}
            >
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{count}</p>
            </div>
          ))}
        </div>

        <AdminPayoutsQueue payouts={allPayouts as unknown as Parameters<typeof AdminPayoutsQueue>[0]["payouts"]} />
      </div>
    </DashboardLayout>
  );
}
