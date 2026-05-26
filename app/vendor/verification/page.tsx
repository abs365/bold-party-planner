import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorVerificationView } from "@/components/vendor/VendorVerificationView";

export const dynamic = "force-dynamic";

export default async function VendorVerificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/vendor/verification");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, business_name, category, verification_level, status, verified, bio, city, phone")
    .eq("user_id", user.id)
    .single();

  if (!vendor) redirect("/vendor/onboarding");

  const [verificationsRes, mediaRes, packagesRes, activityRes] = await Promise.all([
    supabase
      .from("vendor_verifications")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("vendor_media")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .is("deleted_at", null),

    supabase
      .from("vendor_packages")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id),

    supabase
      .from("verification_activity_log")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const level1Met = {
    emailConfirmed: !!user.email_confirmed_at,
    phoneAdded: !!(profile?.phone || vendor.phone),
    bioComplete: !!(vendor.bio && vendor.bio.length > 20),
    cityAdded: !!vendor.city,
    hasPackages: (packagesRes.count ?? 0) >= 1,
    hasMedia: (mediaRes.count ?? 0) >= 3,
  };

  return (
    <DashboardLayout user={profile}>
      <VendorVerificationView
        vendor={vendor as Parameters<typeof VendorVerificationView>[0]["vendor"]}
        email={user.email ?? ""}
        verifications={(verificationsRes.data ?? []) as Parameters<typeof VendorVerificationView>[0]["verifications"]}
        activityLog={(activityRes.data ?? []) as Parameters<typeof VendorVerificationView>[0]["activityLog"]}
        level1Met={level1Met}
      />
    </DashboardLayout>
  );
}
