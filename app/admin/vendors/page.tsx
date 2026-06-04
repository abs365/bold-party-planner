import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminVendorTable } from "@/components/admin/AdminVendorTable";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  let query = adminSupabase
    .from("vendors")
    .select(`
      *,
      profile:profiles(id, full_name, email, avatar_url, created_at),
      media:vendor_media(url, is_cover, type),
      packages:vendor_packages(id, name, price)
    `)
    .order("created_at", { ascending: false });

  if (sp.status && sp.status !== "all") query = query.eq("status", sp.status);
  if (sp.search) {
    query = query.or(`business_name.ilike.%${sp.search}%,city.ilike.%${sp.search}%`);
  }

  const { data: vendors } = await query;

  const { data: stats } = await adminSupabase.from("platform_stats").select("*").single();

  return (
    <DashboardLayout user={profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }}>
      <AdminVendorTable
        vendors={vendors ?? []}
        stats={stats}
        currentStatus={sp.status ?? "all"}
        currentSearch={sp.search ?? ""}
      />
    </DashboardLayout>
  );
}
