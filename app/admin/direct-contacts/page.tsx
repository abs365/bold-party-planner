import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SourceBadge } from "@/components/vendor/SourceBadge";
import { formatDate } from "@/lib/utils";
import type { ManualContact, ManualContactSource } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDirectContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Fetch all manual contacts across all vendors with vendor details
  let query = adminSupabase
    .from("manual_contacts")
    .select("*, vendor:vendors(id, business_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (sp.source) {
    query = query.eq("source", sp.source);
  }

  const { data: contacts, count } = await query;

  const filtered = sp.search
    ? (contacts ?? []).filter((c) => {
        const q = sp.search!.toLowerCase();
        return (
          c.display_name.toLowerCase().includes(q) ||
          (c.display_email ?? "").toLowerCase().includes(q) ||
          (c.display_phone ?? "").includes(q)
        );
      })
    : (contacts ?? []);

  const activeCount   = filtered.filter((c) => !c.is_archived && !c.gdpr_anonymised).length;
  const archivedCount = filtered.filter((c) => c.is_archived).length;
  const convertedCount = filtered.filter((c) => c.linked_profile_id).length;

  const resolvedProfile = profile ?? {
    id: user.id, email: user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString(),
  };

  return (
    <DashboardLayout user={resolvedProfile}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Direct Contacts</h1>
          <p className="text-white/40 text-sm mt-1">
            Off-platform contacts added by vendors. These are NOT registered Elbold customers.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total contacts", value: count ?? filtered.length, color: "text-white" },
            { label: "Active", value: activeCount, color: "text-emerald-400" },
            { label: "Archived", value: archivedCount, color: "text-slate-400" },
            { label: "Converted", value: convertedCount, color: "text-brand-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <form method="GET" className="flex gap-3">
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Search name, email, or phone…"
            className="flex-1 bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/40"
          />
          <select
            name="source"
            defaultValue={sp.source ?? ""}
            className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#0d0d18]">All sources</option>
            {(["instagram","facebook","tiktok","whatsapp","referral","existing_customer","direct","other"] as ManualContactSource[]).map((s) => (
              <option key={s} value={s} className="bg-[#0d0d18]">{s}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-colors">
            Filter
          </button>
        </form>

        {/* Table */}
        <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Source</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Vendor</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Added</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-sm">
                    No direct contacts found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const vendor = c.vendor as { id: string; business_name: string } | null;
                  return (
                    <tr key={c.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">
                          {c.gdpr_anonymised ? <span className="text-white/30 italic">Anonymised</span> : c.display_name}
                        </p>
                        {!c.gdpr_anonymised && c.display_email && (
                          <p className="text-white/35 text-xs">{c.display_email}</p>
                        )}
                        {!c.gdpr_anonymised && c.display_phone && (
                          <p className="text-white/35 text-xs">{c.display_phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={c.source as ManualContactSource} />
                        {c.source_detail && <p className="text-white/30 text-xs mt-1">{c.source_detail}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {vendor ? (
                          <a href={`/admin/vendors/${vendor.id}`} className="text-brand-400 hover:underline text-xs">
                            {vendor.business_name}
                          </a>
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3">
                        {c.gdpr_anonymised ? (
                          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">GDPR erased</span>
                        ) : c.is_archived ? (
                          <span className="text-xs text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">Archived</span>
                        ) : c.linked_profile_id ? (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Converted</span>
                        ) : (
                          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/8">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
