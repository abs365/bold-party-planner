import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminModerationView } from "@/components/admin/AdminModerationView";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // Use service role for admin queries — polyfill with regular client if needed
  const [reportsRes, mediaRes] = await Promise.all([
    supabase
      .from("content_reports")
      .select(`
        id, content_type, content_id, vendor_id, reason, details, status, created_at,
        reporter:profiles!reporter_id(full_name, email),
        vendor:vendors!vendor_id(id, business_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("vendor_media")
      .select(`
        id, url, type, caption, moderation_status, created_at,
        vendor:vendors!vendor_id(id, business_name)
      `)
      .eq("moderation_status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  return (
    <DashboardLayout user={profile}>
      <AdminModerationView
        reports={(reportsRes.data ?? []) as unknown as Parameters<typeof AdminModerationView>[0]["reports"]}
        pendingMedia={(mediaRes.data ?? []) as unknown as Parameters<typeof AdminModerationView>[0]["pendingMedia"]}
      />
    </DashboardLayout>
  );
}
