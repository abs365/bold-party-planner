import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorSubscriptionView } from "@/components/vendor/VendorSubscriptionView";
import type { Profile } from "@/types";
import { CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VendorSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
          <p className="text-white/60 mt-1">Grow your business with more visibility and features</p>
        </div>

        {params.success && (
          <div className="bg-white/4 rounded-xl p-4 mb-6 border border-green-500/30 flex items-center gap-3 text-green-300">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>Subscription activated successfully! Your plan is now live.</span>
          </div>
        )}

        {params.cancelled && (
          <div className="bg-white/4 rounded-xl p-4 mb-6 border border-yellow-500/30 flex items-center gap-3 text-yellow-300">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>Subscription upgrade was cancelled. Your current plan remains unchanged.</span>
          </div>
        )}

        <VendorSubscriptionView />
      </div>
    </DashboardLayout>
  );
}
