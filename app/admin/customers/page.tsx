import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCustomerTable } from "@/components/admin/AdminCustomerTable";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Fetch all profiles that are not vendors or admins.
  // This includes role='customer', role=NULL (trigger failed), and any other non-vendor roles.
  // A separate vendor-role sub-query excludes anyone with a vendor record.
  let query = adminSupabase
    .from("profiles")
    .select("*")
    .or("role.eq.customer,role.is.null")
    .order("created_at", { ascending: false });

  if (sp.search) {
    query = query.or(`full_name.ilike.%${sp.search}%,email.ilike.%${sp.search}%`);
  }

  const { data: customers } = await query;

  const customerIds = (customers ?? []).map((c: Record<string, unknown>) => String(c.id));

  const [eventsRes, bookingsRes, paymentsRes] = await Promise.all([
    customerIds.length
      ? adminSupabase.from("events").select("customer_id").in("customer_id", customerIds)
      : Promise.resolve({ data: [] }),
    customerIds.length
      ? adminSupabase.from("bookings").select("customer_id, status, total_amount").in("customer_id", customerIds)
      : Promise.resolve({ data: [] }),
    customerIds.length
      ? adminSupabase.from("payments").select("booking_id, amount, status").eq("status", "succeeded")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <DashboardLayout user={profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }}>
      <AdminCustomerTable
        customers={customers ?? []}
        events={eventsRes.data ?? []}
        bookings={bookingsRes.data ?? []}
        payments={paymentsRes.data ?? []}
        currentSearch={sp.search ?? ""}
      />
    </DashboardLayout>
  );
}
