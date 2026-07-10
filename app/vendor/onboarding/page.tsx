import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VendorOnboardingWizard } from "@/components/vendor/VendorOnboardingWizard";
import { VendorOnboardingProgress } from "@/components/vendor/VendorOnboardingProgress";
import { computeVendorCompletion } from "@/lib/vendor/completion";
import { track } from "@/lib/analytics";
import { Clock, XCircle, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
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

  // Pending → application under review — show full lifecycle timeline
  if (vendor.status === "pending") {
    const STAGES = [
      {
        id: "received",
        label: "Application Received",
        detail: "Your application has been submitted successfully.",
        done: true,
        active: false,
      },
      {
        id: "review",
        label: "Review In Progress",
        detail: "A member of our vendor standards team is reviewing your profile, portfolio, and business details against our published Vendor Standards. This takes up to 2 working days.",
        done: false,
        active: true,
      },
      {
        id: "verification",
        label: "Verification",
        detail: "We may request ID or additional documents to reach a higher verification level.",
        done: false,
        active: false,
      },
      {
        id: "approved",
        label: "Profile Published",
        detail: "Your profile goes live on the marketplace. Customers can browse and enquire immediately.",
        done: false,
        active: false,
      },
      {
        id: "active",
        label: "Active Vendor",
        detail: "You receive quote requests, respond to customers, and start earning.",
        done: false,
        active: false,
      },
    ];

    return (
      <DashboardLayout user={profile as Profile}>
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Application Under Review</h1>
            <p className="text-slate-400">
              Your application for{" "}
              <span className="text-white font-medium">{vendor.business_name}</span>{" "}
              is being reviewed. We aim to respond within 2 working days.
            </p>
          </div>

          {/* Status timeline */}
          <div className="bg-white/4 border border-white/6 rounded-2xl p-6 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Your Application Journey</p>
            <div className="space-y-0">
              {STAGES.map((stage, i) => (
                <div key={stage.id} className="flex gap-4">
                  {/* connector column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                        stage.done
                          ? "bg-emerald-500/20 border-emerald-500/50"
                          : stage.active
                          ? "bg-amber-500/20 border-amber-500/60"
                          : "bg-white/4 border-white/12"
                      }`}
                    >
                      {stage.done ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : stage.active ? (
                        <Clock size={14} className="text-amber-400" />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">{i + 1}</span>
                      )}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`w-0.5 h-10 mt-1 ${stage.done ? "bg-emerald-500/30" : "bg-white/8"}`} />
                    )}
                  </div>
                  {/* content */}
                  <div className={`pb-8 ${i === STAGES.length - 1 ? "pb-0" : ""}`}>
                    <p
                      className={`text-sm font-semibold mb-0.5 ${
                        stage.done ? "text-emerald-300" : stage.active ? "text-amber-300" : "text-slate-600"
                      }`}
                    >
                      {stage.label}
                      {stage.active && (
                        <span className="ml-2 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">{stage.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* While you wait */}
          <div className="bg-white/3 border border-white/5 rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">While you wait</p>
            <div className="space-y-3">
              {[
                { label: "Add photos to your portfolio", href: "/vendor/media", sub: "A fuller portfolio gives customers more reason to enquire" },
                { label: "Write your bio", href: "/vendor/profile", sub: "Tell customers what makes your service worth booking" },
                { label: "Set up your packages", href: "/vendor/services", sub: "Clear pricing builds customer confidence" },
                { label: "Add your existing contacts to your CRM", href: "/vendor/contacts", sub: "Already have clients from Instagram, WhatsApp or referrals? Bring the first few over now" },
              ].map(({ label, href, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/vendor/dashboard" className="btn-primary flex-1 text-center">
              Go to Dashboard
            </Link>
            <Link href="/support" className="btn-secondary flex-1 text-center">
              Contact Support
            </Link>
          </div>
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
