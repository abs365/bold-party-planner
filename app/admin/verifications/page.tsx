import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminVerificationsView } from "@/components/admin/AdminVerificationsView";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const db = await createAdminClient();
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const [pendingRes] = await Promise.all([
    db
      .from("vendor_verifications")
      .select(`
        *,
        vendor:vendors(id, business_name, category, city, verified, verification_level, suspicious_flag,
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

  return (
    <DashboardLayout user={profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }}>
      <AdminVerificationsView
        initialVerifications={(pendingRes.data ?? []) as unknown as Parameters<typeof AdminVerificationsView>[0]["initialVerifications"]}
        stats={{ pending: pendingCount, approved: approvedCount, flagged: flaggedCount }}
      />
    </DashboardLayout>
  );
}
