import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorServicesManager } from "@/components/vendor/VendorServicesManager";

export const dynamic = "force-dynamic";

export default async function VendorServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id, business_name").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: packages } = await supabase
    .from("vendor_packages")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at");

  return (
    <DashboardLayout user={profile}>
      <VendorServicesManager vendorId={vendor.id} initialPackages={packages ?? []} />
    </DashboardLayout>
  );
}
