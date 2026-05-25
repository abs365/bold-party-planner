import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorReviewsView } from "@/components/vendor/VendorReviewsView";

export const dynamic = "force-dynamic";

export default async function VendorReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id, rating, total_reviews").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/onboarding");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      customer:profiles(full_name, avatar_url)
    `)
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={profile}>
      <VendorReviewsView
        reviews={reviews ?? []}
        vendorRating={Number(vendor.rating ?? 0)}
        totalReviews={Number(vendor.total_reviews ?? 0)}
      />
    </DashboardLayout>
  );
}
