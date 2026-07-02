import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminMonetizationDashboard } from "@/components/admin/AdminMonetizationDashboard";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminMonetizationPage() {
  const auth = await requireAdminRole("global_admin");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  // Fetch monetization data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
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
    subscription_funnel: { period_days: 30, page_viewed: 0, checkout_started: 0, upgraded: 0 },
    churn_risk: [],
  };

  return (
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
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
