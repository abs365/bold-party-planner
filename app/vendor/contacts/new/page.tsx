import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreateContactForm } from "@/components/vendor/CreateContactForm";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-2xl mx-auto">
        <CreateContactForm />
      </div>
    </DashboardLayout>
  );
}
