import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const adminSupabase = auth.db;
  const { data: profile } = await adminSupabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

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
    <DashboardLayout user={profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }} adminRole={auth.role}>
      <AdminAnalytics
        stats={statsRes.data}
        recentPayments={recentPaymentsRes.data ?? []}
        bookings={bookingsByStatusRes.data ?? []}
        vendors={vendorsByCatRes.data ?? []}
      />
    </DashboardLayout>
  );
}
