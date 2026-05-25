import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerBookingDetail } from "@/components/customer/CustomerBookingDetail";

export const dynamic = "force-dynamic";

export default async function CustomerBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const [bookingRes, paymentsRes, reviewRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        *,
        event:events(id, title, date, city, guest_count, venue_name),
        vendor:vendors(id, business_name, category, city, rating, user_id, media:vendor_media(url, type, is_cover)),
        package:vendor_packages(name, price, description, includes),
        invoice:invoices(invoice_number, total, status, created_at)
      `)
      .eq("id", id)
      .eq("customer_id", user.id)
      .single(),
    supabase.from("payments").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("reviews").select("*").eq("booking_id", id).eq("customer_id", user.id).single(),
  ]);

  if (!bookingRes.data) notFound();

  return (
    <DashboardLayout user={profile}>
      <CustomerBookingDetail
        booking={bookingRes.data}
        payments={paymentsRes.data ?? []}
        existingReview={reviewRes.data}
        showReviewForm={sp.review === "1"}
        userId={user.id}
      />
    </DashboardLayout>
  );
}
