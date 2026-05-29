import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminMonetizationDashboard } from "@/components/admin/AdminMonetizationDashboard";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminMonetizationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // Fetch monetization data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let data = null;
  try {
    const res = await fetch(`${baseUrl}/api/admin/monetization?days=30`, {
      headers: { cookie: "" }, // server-to-server; auth checked via supabase above
      cache: "no-store",
    });
    if (res.ok) data = await res.json();
  } catch { /* non-critical */ }

  // Fallback empty state
  const monetizationData = data ?? {
    summary: { mrr: 0, arr: 0, paying_vendors: 0, total_vendors: 0, paid_conversion: 0, past_due_count: 0, cancelled_count: 0, at_risk_mrr: 0 },
    plan_distribution: { free: 0, pro: 0, premium: 0, elite: 0 },
    category_revenue: {},
    billing_events: [],
    trends: { upgrades: 0, cancels: 0, failures: 0, recovered: 0, net_new: 0 },
  };

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Monetization</h1>
          <p className="mt-1 text-sm text-gray-400">
            Subscription revenue, plan distribution, and billing health.
          </p>
        </div>
        <AdminMonetizationDashboard initialData={monetizationData} />
      </div>
    </DashboardLayout>
  );
}
