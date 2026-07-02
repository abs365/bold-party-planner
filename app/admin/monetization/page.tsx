import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminMonetizationDashboard } from "@/components/admin/AdminMonetizationDashboard";
import { computeCommercialMetrics } from "@/lib/vendor/commercial-metrics";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminMonetizationPage() {
  const auth = await requireAdminRole("global_admin");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  // Computed directly, in-process - this used to do a self-fetch to its own
  // /api/admin/monetization route with an empty cookie header, which meant
  // that route's own auth check always failed silently and this page
  // rendered a hardcoded all-zero fallback in production regardless of real
  // data. There is no reason for a server component to fetch its own API
  // route over HTTP at all; calling the shared metrics function directly
  // removes the entire class of bug.
  const monetizationData = await computeCommercialMetrics(auth.db, 30);

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
