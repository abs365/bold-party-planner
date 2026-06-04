import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationCentre } from "@/components/NotificationCentre";
import { PushNotificationToggle } from "@/components/pwa/PushNotificationToggle";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-white/60 mt-1">Your recent activity and alerts</p>
        </div>

        {/* Push notification opt-in */}
        <div className="mb-6">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Device Alerts</p>
          <PushNotificationToggle />
        </div>

        <NotificationCentre notifications={notifications ?? []} />
      </div>
    </DashboardLayout>
  );
}
