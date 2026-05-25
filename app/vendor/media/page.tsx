import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorMediaManager } from "@/components/vendor/VendorMediaManager";

export const dynamic = "force-dynamic";

export default async function VendorMediaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id, business_name").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: media } = await supabase
    .from("vendor_media")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("sort_order", { ascending: true });

  return (
    <DashboardLayout user={profile}>
      <VendorMediaManager vendorId={vendor.id} initialMedia={media ?? []} />
    </DashboardLayout>
  );
}
