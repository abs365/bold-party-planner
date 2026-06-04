import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PilotCRM } from "@/components/admin/PilotCRM";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function PilotVendorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const db = await createAdminClient();

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
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
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
