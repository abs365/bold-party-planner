import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorApplyForm } from "@/components/vendor/VendorApplyForm";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData;

    // Already applied — redirect to the right place instead of showing the form again
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendor) {
      if (vendor.status === "approved") {
        redirect("/vendor/dashboard");
      }
      // pending, rejected, suspended — show onboarding page which handles all these states
      redirect("/vendor/onboarding");
    }
  }

  return <VendorApplyForm profile={profile} />;
}
