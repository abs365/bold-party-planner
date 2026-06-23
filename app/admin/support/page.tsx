import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminSupportView } from "@/components/admin/AdminSupportView";
import { HelpCircle } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  return (
    <DashboardLayout user={(profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile} adminRole={auth.role}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle size={20} className="text-brand-400" />
            Support Tooling
          </h1>
          <p className="text-slate-400 text-sm mt-1">User and vendor lookup, audit log viewer, and quick links</p>
        </div>

        <AdminSupportView />
      </div>
    </DashboardLayout>
  );
}
