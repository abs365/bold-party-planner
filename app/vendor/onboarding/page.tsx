import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorOnboardingWizard } from "@/components/vendor/VendorOnboardingWizard";

export const dynamic = "force-dynamic";

export default async function VendorOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendor } = await supabase.from("vendors").select("id, status").eq("user_id", user.id).single();

  if (vendor?.status === "approved") redirect("/vendor/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-brand-text mb-2">Become a Vendor</h1>
          <p className="text-white/60">Set up your profile to start receiving bookings on Bold Party</p>
        </div>
        <VendorOnboardingWizard />
      </div>
    </main>
  );
}
