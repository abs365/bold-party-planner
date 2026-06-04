import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerQuotesView } from "@/components/customer/CustomerQuotesView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function CustomerQuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city, rating, media:vendor_media(url, is_cover)),
      event:events(id, title, date),
      response:quote_responses(*)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">My Quotes</h1>
          <p className="text-white/60 mt-1">Track your quote requests and vendor responses</p>
        </div>
        <CustomerQuotesView quotes={quotes ?? []} />
      </div>
    </DashboardLayout>
  );
}
