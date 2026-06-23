import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminVendorTable } from "@/components/admin/AdminVendorTable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const adminSupabase = auth.db;
  const { data: profile } = await adminSupabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

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

  const { data: vendors, error: vendorQueryError } = await query;
  if (vendorQueryError) {
    logger.error("admin.vendors.query_failed", { err: vendorQueryError });
  }

  const { data: stats } = await adminSupabase.from("platform_stats").select("*").single();

  return (
    <DashboardLayout user={profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }} adminRole={auth.role}>
      <AdminVendorTable
        vendors={vendors ?? []}
        stats={stats}
        currentStatus={sp.status ?? "all"}
        currentSearch={sp.search ?? ""}
      />
    </DashboardLayout>
  );
}
