import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PilotCRM } from "@/components/admin/PilotCRM";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function PilotVendorsPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const { data: pilotVendors } = await db
    .from("pilot_vendors")
    .select("*")
    .order("created_at", { ascending: false });

  // Status distribution for funnel
  const vendors = pilotVendors ?? [];
  const funnel = {
    prospect:   vendors.filter((v) => v.status === "prospect").length,
    contacted:  vendors.filter((v) => v.status === "contacted").length,
    interested: vendors.filter((v) => v.status === "interested").length,
    registered: vendors.filter((v) => v.status === "registered").length,
    approved:   vendors.filter((v) => v.status === "approved").length,
    verified:   vendors.filter((v) => v.status === "verified").length,
    active:     vendors.filter((v) => v.status === "active").length,
    lost:       vendors.filter((v) => v.status === "lost").length,
  };

  return (
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pilot Vendor CRM</h1>
          <p className="text-white/50 text-sm mt-1">Track outreach and onboarding for the first 10 pilot vendors</p>
        </div>
        <PilotCRM initialVendors={vendors} funnel={funnel} />
      </div>
    </DashboardLayout>
  );
}
