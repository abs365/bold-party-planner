import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuoteComparisonView } from "@/components/customer/QuoteComparisonView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function QuoteComparePage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const { event_id } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  if (!event_id) redirect("/dashboard/quotes");

  // Load event for the title
  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", event_id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!event) redirect("/dashboard/quotes");

  // Load all quotes for this event (only ones with vendor responses)
  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      id,
      status,
      shortlisted_at,
      vendor:vendors(
        id, business_name, category, city, rating, review_count,
        verification_level, response_rate, completed_jobs_count,
        media:vendor_media(url, is_cover)
      ),
      response:quote_responses(
        id, price, deposit_amount, message, title, description,
        services, terms, duration_hours, valid_until, includes
      )
    `)
    .eq("customer_id", user.id)
    .eq("event_id", event_id)
    .in("status", ["responded", "viewed", "shortlisted"])
    .order("created_at", { ascending: true });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Compare Quotes</h1>
          <p className="text-white/50 mt-1 text-sm">Side-by-side comparison of vendor responses for your event</p>
        </div>
        <QuoteComparisonView
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quotes={(quotes ?? []) as any}
          eventTitle={event.title}
          eventId={event.id}
        />
      </div>
    </DashboardLayout>
  );
}
