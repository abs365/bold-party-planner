import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuoteDetailView } from "@/components/customer/QuoteDetailView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: quote } = await supabase
    .from("quotes")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city, rating, review_count, bio, verification_level, response_rate, completed_jobs_count, media:vendor_media(url, is_cover, type), packages:vendor_packages(id, name, price, includes)),
      customer:profiles(id, full_name),
      event:events(id, title, date, city, guest_count),
      response:quote_responses(*)
    `)
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (!quote) notFound();

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Quote Details</h1>
      </div>
      <QuoteDetailView quote={quote} />
    </DashboardLayout>
  );
}
