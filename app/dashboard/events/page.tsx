import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerEventsView } from "@/components/customer/CustomerEventsView";

export const dynamic = "force-dynamic";

export default async function CustomerEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  const { data: events } = await supabase
    .from("events")
    .select(`
      *,
      bookings(id, status, total_amount, vendor:vendors(business_name, category))
    `)
    .eq("customer_id", user.id)
    .order("date", { ascending: true });

  return (
    <DashboardLayout user={profile}>
      <CustomerEventsView events={events ?? []} />
    </DashboardLayout>
  );
}
