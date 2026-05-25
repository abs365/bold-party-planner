import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const [statsRes, recentPaymentsRes, bookingsByStatusRes, vendorsByCatRes] = await Promise.all([
    adminSupabase.from("platform_stats").select("*").single(),
    adminSupabase
      .from("payments")
      .select("amount, type, status, created_at")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(30),
    adminSupabase
      .from("bookings")
      .select("status")
      .order("created_at"),
    adminSupabase
      .from("vendors")
      .select("category, status")
      .eq("status", "approved"),
  ]);

  return (
    <DashboardLayout user={profile!}>
      <AdminAnalytics
        stats={statsRes.data}
        recentPayments={recentPaymentsRes.data ?? []}
        bookings={bookingsByStatusRes.data ?? []}
        vendors={vendorsByCatRes.data ?? []}
      />
    </DashboardLayout>
  );
}
