import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Shield, Users, AlertCircle } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

const ROLE_LABELS: Record<string, string> = {
  founder:      "Founder Admin",
  global_admin: "Global Admin",
  ops_admin:    "Ops Admin",
  reviewer:     "Reviewer",
};

const ROLE_COLOURS: Record<string, string> = {
  founder:      "bg-purple-100 text-purple-800",
  global_admin: "bg-blue-100 text-blue-800",
  ops_admin:    "bg-green-100 text-green-800",
  reviewer:     "bg-gray-100 text-gray-700",
};

export default async function AdminTeamPage() {
  const auth = await requireAdminRole("founder");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  // Fetch all role assignments (active and revoked) for history
  const { data: roleRows } = await db
    .from("admin_roles")
    .select("id, user_id, role, granted_by, granted_at, revoked_at, notes")
    .order("granted_at", { ascending: false })
    .limit(100);

  const activeRoles = (roleRows ?? []).filter((r) => !r.revoked_at);
  const revokedRoles = (roleRows ?? []).filter((r) => r.revoked_at);

  // Recent role governance decisions
  const { data: roleDecisions } = await db
    .from("governance_decisions")
    .select("id, action_type, actor_email, actor_role, new_status, previous_status, created_at, admin_notes")
    .eq("entity_type", "admin_role")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <DashboardLayout user={profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() } as Profile} adminRole={auth.role}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-purple-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Team</h1>
            <p className="text-sm text-gray-500">Role assignments and access management</p>
          </div>
        </div>

        {/* Founder note */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-medium">Founder Admin access</p>
            <p className="mt-1">Founder access is controlled by the <code className="bg-purple-100 px-1 rounded">ADMIN_EMAILS</code> environment variable in Vercel. It is not stored in this table. Role grants and revokes here do not affect Founder access.</p>
          </div>
        </div>

        {/* Founder row */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Current Team
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {/* Founder (from env var) */}
            {ADMIN_EMAILS.map((email) => (
              <div key={email} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{email}</p>
                  <p className="text-xs text-gray-400">via ADMIN_EMAILS env var</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLOURS.founder}`}>
                  {ROLE_LABELS.founder}
                </span>
              </div>
            ))}

            {/* Active DB roles */}
            {activeRoles.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No other admin roles assigned yet. Role grants will appear here.
              </div>
            )}
            {activeRoles.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.user_id}</p>
                  <p className="text-xs text-gray-400">
                    Granted {new Date(r.granted_at).toLocaleDateString("en-GB")}
                    {r.notes ? ` — ${r.notes}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLOURS[r.role] ?? "bg-gray-100 text-gray-700"}`}>
                  {ROLE_LABELS[r.role] ?? r.role}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Role decision history */}
        {(roleDecisions ?? []).length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Role Change History</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {roleDecisions!.map((d) => (
                <div key={d.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      {d.action_type === "role.granted" ? "Role granted" : "Role revoked"}
                      {d.new_status ? ` — ${ROLE_LABELS[d.new_status] ?? d.new_status}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {d.actor_email} ({d.actor_role})
                      {d.admin_notes ? ` · ${d.admin_notes}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {new Date(d.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Revoked roles */}
        {revokedRoles.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Revoked Roles</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {revokedRoles.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 opacity-60">
                  <div>
                    <p className="text-sm text-gray-700">{r.user_id}</p>
                    <p className="text-xs text-gray-400">
                      {ROLE_LABELS[r.role] ?? r.role} · Revoked {new Date(r.revoked_at!).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">Revoked</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Phase note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium">Phase 70D.5 pending</p>
          <p className="mt-1">Role assignment via this page is not yet active. Route-level enforcement is implemented in Phase 70D.5. Until then, only Founder Admin (AY) has active admin access.</p>
        </div>

      </div>
    </DashboardLayout>
  );
}
