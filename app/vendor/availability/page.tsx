import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AvailabilityCalendar } from "@/components/vendor/AvailabilityCalendar";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorAvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/onboarding");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Availability Calendar</h1>
          <p className="text-white/60 mt-1">Block dates when you&apos;re unavailable so customers only request bookings on available days</p>
        </div>
        <AvailabilityCalendar />
        <div className="glass-card p-4 mt-4 text-sm text-white/50 space-y-1">
          <p><strong className="text-white/70">How it works:</strong></p>
          <p>• Click any future date to block it as unavailable</p>
          <p>• Click a blocked date to unblock it</p>
          <p>• Blocked dates are shown to customers when they browse your profile</p>
          <p>• Confirmed bookings automatically mark that date as unavailable</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
