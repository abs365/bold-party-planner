import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MessagingView } from "@/components/messaging/MessagingView";
import { PendingVendorBanner } from "@/components/vendor/PendingVendorBanner";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  const { data: vendor } = await supabase.from("vendors").select("id, status").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: threads } = await supabase
    .from("message_threads")
    .select(`
      *,
      customer:profiles!message_threads_customer_id_fkey(id, full_name, avatar_url),
      vendor:vendors(id, business_name),
      messages(id, content, sender_id, created_at, read_by_customer, read_by_vendor)
    `)
    .eq("vendor_id", vendor.id)
    .order("last_message_at", { ascending: false });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {vendor.status === "pending" && <PendingVendorBanner />}
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-white/60 mt-1">Conversations with your customers about bookings and quotes</p>
        </div>
        <MessagingView
          threads={(threads ?? []) as unknown[]}
          currentUserId={user.id}
          initialThreadId={params.thread}
          isVendor
        />
      </div>
    </DashboardLayout>
  );
}
