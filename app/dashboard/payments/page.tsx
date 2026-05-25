import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerPaymentsView } from "@/components/customer/CustomerPaymentsView";

export const dynamic = "force-dynamic";

export default async function CustomerPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const [paymentsRes, invoicesRes] = await Promise.all([
    supabase
      .from("payments")
      .select(`
        *,
        booking:bookings(
          id, status,
          vendor:vendors(business_name, category),
          event:events(title, date)
        )
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select(`
        *,
        booking:bookings(
          id,
          vendor:vendors(business_name),
          event:events(title, date)
        )
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <DashboardLayout user={profile}>
      <CustomerPaymentsView
        payments={paymentsRes.data ?? []}
        invoices={invoicesRes.data ?? []}
      />
    </DashboardLayout>
  );
}
