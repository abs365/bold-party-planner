import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingRequestForm } from "@/components/customer/BookingRequestForm";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string; package?: string; event?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const [vendorRes, eventsRes] = await Promise.all([
    params.vendor
      ? supabase
          .from("vendors")
          .select("*, packages:vendor_packages(*), media:vendor_media(url, type, is_cover)")
          .eq("id", params.vendor)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("events")
      .select("id, title, date, city, guest_count, budget")
      .eq("customer_id", user.id)
      .neq("status", "cancelled")
      .order("date", { ascending: true }),
  ]);

  if (!vendorRes.data) redirect("/browse");

  return (
    <DashboardLayout user={profile}>
      <BookingRequestForm
        vendor={vendorRes.data}
        events={eventsRes.data ?? []}
        userId={user.id}
        preSelectedPackage={params.package}
        preSelectedEvent={params.event}
      />
    </DashboardLayout>
  );
}
