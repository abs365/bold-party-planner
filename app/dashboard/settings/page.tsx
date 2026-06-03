import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Bell, Shield, CreditCard, CheckCircle2, KeyRound } from "lucide-react";
import type { Profile } from "@/types";
import { PhoneEditForm } from "@/components/account/PhoneEditForm";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const typedProfile = profile as Profile;

  return (
    <DashboardLayout user={typedProfile}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account preferences and personal information</p>
        </div>

        {/* Profile card */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {typedProfile.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{typedProfile.full_name ?? "User"}</h2>
              <p className="text-sm text-slate-400">{typedProfile.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} className="text-brand-400" />
                <span className="text-xs text-brand-400 capitalize">{typedProfile.role} Account</span>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            {[
              { label: "Full Name", value: typedProfile.full_name ?? "Not set" },
              { label: "Email", value: typedProfile.email },
              { label: "Role", value: typedProfile.role },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/6">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-sm font-medium text-white capitalize">{item.value}</span>
              </div>
            ))}
            <PhoneEditForm
              currentPhone={typedProfile.phone}
              phoneVerified={typedProfile.phone_verified}
            />

            {/* Trust indicators */}
            <div className="pt-4">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Identity status</p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/4 border border-white/8 text-emerald-400">
                  <CheckCircle2 size={11} /> Email verified
                </span>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${typedProfile.phone_verified ? "bg-white/4 border-white/8 text-emerald-400" : "bg-white/2 border-white/5 text-slate-600"}`}>
                  <CheckCircle2 size={11} />
                  {typedProfile.phone_verified ? "Phone verified" : "Phone not verified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Account Actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/dashboard/notifications"
              className="flex items-center gap-3 p-4 rounded-xl border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all"
            >
              <Bell size={18} className="text-brand-400" />
              <div>
                <div className="text-sm font-semibold text-white">Notification Settings</div>
                <div className="text-xs text-slate-500">Manage how you receive alerts</div>
              </div>
            </Link>

            <Link
              href="/dashboard/payments"
              className="flex items-center gap-3 p-4 rounded-xl border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all"
            >
              <CreditCard size={18} className="text-brand-400" />
              <div>
                <div className="text-sm font-semibold text-white">Payment Methods</div>
                <div className="text-xs text-slate-500">Manage saved payment details</div>
              </div>
            </Link>

            <Link
              href="/forgot-password"
              className="flex items-center gap-3 p-4 rounded-xl border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all"
            >
              <KeyRound size={18} className="text-brand-400" />
              <div>
                <div className="text-sm font-semibold text-white">Change Password</div>
                <div className="text-xs text-slate-500">Send a secure reset link to your email</div>
              </div>
            </Link>

            <SignOutButton />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
