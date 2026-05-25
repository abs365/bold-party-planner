import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorBookingDetail } from "@/components/vendor/VendorBookingDetail";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      *,
      event:events(title, date, start_time, city, guest_count, budget, venue_name, theme, notes),
      customer:profiles(full_name, email, phone, avatar_url),
      package:vendor_packages(name, price, description, includes)
    `)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (!booking) notFound();

  return (
    <DashboardLayout user={profile}>
      <VendorBookingDetail booking={booking as Booking} />
    </DashboardLayout>
  );
}
