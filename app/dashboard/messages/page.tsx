import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MessagingView } from "@/components/messaging/MessagingView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  // Determine role to fetch correct threads
  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();

  const query = vendor
    ? supabase.from("message_threads").select(`*, customer:profiles!message_threads_customer_id_fkey(id, full_name, avatar_url), vendor:vendors(id, business_name), messages(id, content, sender_id, created_at, read_by_customer, read_by_vendor)`).eq("vendor_id", vendor.id)
    : supabase.from("message_threads").select(`*, customer:profiles!message_threads_customer_id_fkey(id, full_name, avatar_url), vendor:vendors(id, business_name), messages(id, content, sender_id, created_at, read_by_customer, read_by_vendor)`).eq("customer_id", user.id);

  const { data: threads } = await query.order("last_message_at", { ascending: false });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-white/60 mt-1">Direct conversations with vendors and customers</p>
        </div>
        <MessagingView
          threads={(threads ?? []) as unknown[]}
          currentUserId={user.id}
          initialThreadId={params.thread}
          isVendor={!!vendor}
        />
      </div>
    </DashboardLayout>
  );
}
