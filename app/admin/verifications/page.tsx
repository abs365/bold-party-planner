import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminVerificationsView } from "@/components/admin/AdminVerificationsView";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const [pendingRes] = await Promise.all([
    db
      .from("vendor_verifications")
      .select(`
        *,
        vendor:vendors(id, business_name, category, city, verified, verification_level, suspicious_flag, status,
          profile:profiles(full_name, email)
        )
      `)
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(100),

  ]);

  const pendingCount = pendingRes.data?.length ?? 0;
  const approvedCount = (await db
    .from("vendor_verifications")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")).count ?? 0;

  const flaggedCount = (await db
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("suspicious_flag", true)).count ?? 0;

  const suspendedCount = (await db
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("status", "suspended")).count ?? 0;

  return (
    <DashboardLayout user={profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }} adminRole={auth.role}>
      <AdminVerificationsView
        initialVerifications={(pendingRes.data ?? []) as unknown as Parameters<typeof AdminVerificationsView>[0]["initialVerifications"]}
        stats={{ pending: pendingCount, approved: approvedCount, flagged: flaggedCount, suspended: suspendedCount }}
      />
    </DashboardLayout>
  );
}
