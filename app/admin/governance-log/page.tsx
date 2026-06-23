import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClipboardList, Bot, User } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "vendor.approved":                     "Vendor approved",
  "vendor.rejected":                     "Vendor rejected",
  "vendor.reinstated":                   "Vendor reinstated",
  "vendor.suspended":                    "Vendor suspended",
  "vendor.warning_issued":               "Warning issued",
  "vendor.warning_resolved":             "Warning resolved",
  "vendor.bulk_approved":                "Bulk approved",
  "vendor.bulk_rejected":                "Bulk rejected",
  "vendor.bulk_suspended":               "Bulk suspended",
  "vendor.flagged":                      "Vendor flagged",
  "vendor.unflagged":                    "Vendor unflagged",
  "vendor.auto_flagged":                 "Auto-flagged",
  "vendor.auto_unflagged":               "Auto-unflagged",
  "vendor.auto_warning_issued":          "Auto-warning issued",
  "verification.document_approved":      "Document approved",
  "verification.document_rejected":      "Document rejected",
  "verification.resubmission_requested": "Resubmission requested",
  "verification.level_upgraded":         "Level upgraded",
  "verification.level_downgraded":       "Level downgraded",
  "payout.marked_paid":                  "Payout marked paid",
  "payout.cancelled":                    "Payout cancelled",
  "review.approved":                     "Review approved",
  "review.flagged":                      "Review flagged",
  "review.removed":                      "Review removed",
  "dispute.resolved":                    "Dispute resolved",
  "dispute.dismissed":                   "Dispute dismissed",
  "role.granted":                        "Role granted",
  "role.revoked":                        "Role revoked",
};

const ACTION_COLOURS: Record<string, string> = {
  "vendor.approved":                     "bg-green-100 text-green-800",
  "vendor.reinstated":                   "bg-green-100 text-green-800",
  "vendor.bulk_approved":                "bg-green-100 text-green-800",
  "verification.document_approved":      "bg-green-100 text-green-800",
  "verification.level_upgraded":         "bg-green-100 text-green-800",
  "payout.marked_paid":                  "bg-green-100 text-green-800",
  "review.approved":                     "bg-green-100 text-green-800",
  "vendor.rejected":                     "bg-red-100 text-red-800",
  "vendor.suspended":                    "bg-red-100 text-red-800",
  "vendor.bulk_rejected":                "bg-red-100 text-red-800",
  "vendor.bulk_suspended":               "bg-red-100 text-red-800",
  "verification.document_rejected":      "bg-red-100 text-red-800",
  "verification.level_downgraded":       "bg-red-100 text-red-800",
  "review.removed":                      "bg-red-100 text-red-800",
  "role.revoked":                        "bg-red-100 text-red-800",
  "payout.cancelled":                    "bg-red-100 text-red-800",
  "vendor.warning_issued":               "bg-amber-100 text-amber-800",
  "vendor.flagged":                      "bg-amber-100 text-amber-800",
  "vendor.auto_flagged":                 "bg-amber-100 text-amber-800",
  "vendor.auto_warning_issued":          "bg-amber-100 text-amber-800",
  "review.flagged":                      "bg-amber-100 text-amber-800",
};

function badge(actionType: string): string {
  return ACTION_COLOURS[actionType] ?? "bg-gray-100 text-gray-700";
}

export default async function GovernanceLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    entity_type?: string;
    action_type?: string;
    automated?: string;
    limit?: string;
  }>;
}) {
  const auth = await requireAdminRole("global_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const sp = await searchParams;
  const limit = Math.min(parseInt(sp.limit ?? "100", 10), 200);

  let query = db
    .from("governance_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sp.entity_type) query = query.eq("entity_type", sp.entity_type);
  if (sp.action_type) query = query.eq("action_type", sp.action_type);
  if (sp.automated === "true")  query = query.eq("is_automated", true);
  if (sp.automated === "false") query = query.eq("is_automated", false);

  const { data: decisions } = await query;

  // Summary counts
  const total = decisions?.length ?? 0;
  const automated = decisions?.filter((d) => d.is_automated).length ?? 0;
  const human = total - automated;

  return (
    <DashboardLayout user={profile ?? { id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() } as Profile} adminRole={auth.role}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Governance Log</h1>
            <p className="text-sm text-gray-500">Immutable record of all governance decisions</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total decisions</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Human decisions</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{human}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Automated</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{automated}</p>
          </div>
        </div>

        {/* Filter bar */}
        <form method="GET" className="flex flex-wrap gap-2">
          <select name="entity_type" defaultValue={sp.entity_type ?? ""} className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white">
            <option value="">All entities</option>
            <option value="vendor">Vendor</option>
            <option value="vendor_verification">Verification</option>
            <option value="payout">Payout</option>
            <option value="review">Review</option>
            <option value="dispute">Dispute</option>
            <option value="admin_role">Admin role</option>
          </select>
          <select name="automated" defaultValue={sp.automated ?? ""} className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-white">
            <option value="">All sources</option>
            <option value="false">Human only</option>
            <option value="true">Automated only</option>
          </select>
          <button type="submit" className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700">
            Filter
          </button>
          <a href="/admin/governance-log" className="text-sm text-gray-400 px-3 py-1.5 hover:text-gray-600">
            Clear
          </a>
        </form>

        {/* Decision table */}
        {total === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No governance decisions recorded yet.</p>
            <p className="text-gray-400 text-xs mt-1">Decisions will appear here as admin actions are taken.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">§</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {decisions!.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {new Date(d.created_at).toLocaleDateString("en-GB")}{" "}
                      <span className="text-gray-400">{new Date(d.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {d.is_automated ? (
                          <Bot className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge(d.action_type)}`}>
                          {ACTION_LABELS[d.action_type] ?? d.action_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{d.entity_type}</span>
                      <span className="ml-1 text-gray-400 font-mono">{d.entity_id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {d.actor_email === "system@elbold.internal" ? (
                        <span className="text-gray-400 italic">system</span>
                      ) : (
                        <>
                          <p>{d.actor_email}</p>
                          <p className="text-gray-400">{d.actor_role}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {d.previous_status || d.new_status ? (
                        <span>
                          {d.previous_status && <span className="text-gray-400">{d.previous_status}</span>}
                          {d.previous_status && d.new_status && <span className="text-gray-300 mx-1">→</span>}
                          {d.new_status && <span className="text-gray-700 font-medium">{d.new_status}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {d.handbook_section ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Records in this log are protected by an immutability trigger — they cannot be modified or deleted through any application path.
        </p>
      </div>
    </DashboardLayout>
  );
}
