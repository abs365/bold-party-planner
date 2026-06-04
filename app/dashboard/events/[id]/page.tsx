import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventDetailView } from "@/components/customer/EventDetailView";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  const [eventRes, bookingsRes, checklistRes] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("customer_id", user.id)
      .single(),
    supabase
      .from("bookings")
      .select(`
        *,
        vendor:vendors(id, business_name, category, city, rating, media:vendor_media(url, type, is_cover)),
        package:vendor_packages(name, price)
      `)
      .eq("event_id", id)
      .order("created_at"),
    supabase
      .from("checklist_progress")
      .select("*")
      .eq("event_id", id)
      .order("category"),
  ]);

  if (!eventRes.data) notFound();

  return (
    <DashboardLayout user={profile}>
      <EventDetailView
        event={eventRes.data}
        bookings={bookingsRes.data ?? []}
        checklist={checklistRes.data ?? []}
      />
    </DashboardLayout>
  );
}
