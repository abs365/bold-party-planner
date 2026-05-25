import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorQuotesView } from "@/components/vendor/VendorQuotesView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorQuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/onboarding");

  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      *,
      customer:profiles(id, full_name, avatar_url),
      event:events(id, title, date, city, guest_count),
      response:quote_responses(*)
    `)
    .eq("vendor_id", vendor.id)
    .order("lead_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-white/60 mt-1">New leads from customers planning events</p>
        </div>
        <VendorQuotesView quotes={quotes ?? []} />
      </div>
    </DashboardLayout>
  );
}
