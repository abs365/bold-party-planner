import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminModerationView } from "@/components/admin/AdminModerationView";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const [reportsRes, mediaRes] = await Promise.all([
    db
      .from("content_reports")
      .select(`
        id, content_type, content_id, vendor_id, reason, details, status, created_at,
        reporter:profiles!reporter_id(full_name, email),
        vendor:vendors!vendor_id(id, business_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100),

    db
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
    <DashboardLayout user={profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }} adminRole={auth.role}>
      <AdminModerationView
        reports={(reportsRes.data ?? []) as unknown as Parameters<typeof AdminModerationView>[0]["reports"]}
        pendingMedia={(mediaRes.data ?? []) as unknown as Parameters<typeof AdminModerationView>[0]["pendingMedia"]}
      />
    </DashboardLayout>
  );
}
