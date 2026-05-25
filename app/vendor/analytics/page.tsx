import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorAnalyticsDashboard } from "@/components/vendor/VendorAnalyticsDashboard";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/onboarding");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/60 mt-1">Track your profile performance and business growth</p>
        </div>
        <VendorAnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
}
