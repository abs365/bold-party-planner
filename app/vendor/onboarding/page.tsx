import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorOnboardingWizard } from "@/components/vendor/VendorOnboardingWizard";
import { VendorOnboardingProgress } from "@/components/vendor/VendorOnboardingProgress";
import { computeVendorCompletion } from "@/lib/vendor/completion";
import { track } from "@/lib/analytics";
import { Clock, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/vendor/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, business_name, status, bio, phone, city, min_price, instagram_url, website_url, verification_level")
    .eq("user_id", user.id)
    .single();

  // No vendor row ? send to the application form, not the onboarding wizard.
  // The wizard requires an existing vendor row (for PATCH /api/vendor/profile).
  if (!vendor) redirect("/vendor/apply");

  // Pending → application under review
  if (vendor.status === "pending") {
    return (
      <DashboardLayout user={profile as Profile}>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-6">
            <Clock size={32} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Application Under Review</h1>
          <p className="text-slate-400 mb-8">
            Your application for <span className="text-white font-medium">{vendor.business_name}</span> is
            being reviewed by our team. We usually approve within 24 hours.
          </p>
          <div className="bg-white/4 border border-white/6 rounded-xl p-6 text-left space-y-3 mb-8">
            <div className="text-sm font-semibold text-white mb-4">What happens next?</div>
            {[
              "Our team reviews your profile for quality and completeness",
              "You'll receive an email notification when approved",
              "Your profile goes live on the marketplace immediately after approval",
              "You can then complete your full profile to start receiving leads",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-brand-400">{i + 1}</span>
                </div>
                <span className="text-sm text-slate-300">{step}</span>
              </div>
            ))}
          </div>
          <Link href="/vendor/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Rejected → show reason and option to reapply
  if (vendor.status === "rejected") {
    return (
      <DashboardLayout user={profile as Profile}>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Application Not Approved</h1>
          <p className="text-slate-400 mb-8">
            Your application for <span className="text-white font-medium">{vendor.business_name}</span> was
            not approved. Please review our vendor guidelines and reapply with a complete profile.
          </p>
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-5 text-left mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-300 mb-1">Common rejection reasons</div>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Incomplete business description</li>
                  <li>Missing service category or pricing</li>
                  <li>Insufficient portfolio photos</li>
                  <li>Contact details not provided</li>
                </ul>
              </div>
            </div>
          </div>
          <Link href="/vendor/apply" className="btn-primary">
            Reapply <ArrowRight size={14} className="inline ml-1" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Suspended
  if (vendor.status === "suspended") {
    return (
      <DashboardLayout user={profile as Profile}>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Account Suspended</h1>
          <p className="text-slate-400 mb-8">
            Your vendor account has been suspended. Contact support for assistance.
          </p>
          <Link href="/support" className="btn-secondary">
            Contact Support
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Approved → post-approval onboarding journey
  const [mediaRes, packageRes, availabilityRes] = await Promise.all([
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
      .from("vendor_availability")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .limit(1),
  ]);

  const mediaCount = mediaRes.count ?? 0;
  const packageCount = packageRes.count ?? 0;
  const hasAvailability = (availabilityRes.count ?? 0) > 0;

  const completion = computeVendorCompletion({
    vendor,
    mediaCount,
    packageCount,
    hasAvailability,
  });

  // Track funnel: approved vendor viewed onboarding checklist
  void track({
    event: "vendor.onboarding.viewed",
    userId: user.id,
    properties: { score: completion.score, tier: completion.strengthLabel },
  });

  // Track marketplace-ready milestone on first crossing
  if (completion.isMarketplaceReady) {
    void track({
      event: "vendor.activation.marketplace_ready",
      userId: user.id,
      properties: { score: completion.score },
    });
  }

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Setup</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete these steps to maximise your visibility and start receiving leads.
          </p>
        </div>
        <VendorOnboardingProgress
          completion={completion}
          vendorName={vendor.business_name}
        />
      </div>
    </DashboardLayout>
  );
}
