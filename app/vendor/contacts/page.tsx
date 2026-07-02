import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ContactListView } from "@/components/vendor/ContactListView";
import type { ManualContact, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: contacts } = await supabase
    .from("manual_contacts")
    .select("id, display_name, display_email, display_phone, source, source_detail, notes, linked_profile_id, is_archived, gdpr_anonymised, stage, follow_up_at, created_at, updated_at")
    .eq("vendor_id", vendor.id)
    .eq("is_archived", showArchived)
    .order("follow_up_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto">
        <ContactListView
          contacts={(contacts ?? []) as ManualContact[]}
          showArchived={showArchived}
        />
      </div>
    </DashboardLayout>
  );
}
