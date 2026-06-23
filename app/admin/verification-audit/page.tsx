import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Shield, Phone, Mail, MapPin,
  AlertTriangle, ChevronRight, BadgeCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";


interface Gap {
  label: string;
  icon: React.ElementType;
  color: string;
}

function getGaps(vendor: Record<string, unknown>): Gap[] {
  const gaps: Gap[] = [];
  const verLevel = Number(vendor.verification_level ?? 0);
  if (!vendor.phone) gaps.push({ label: "No phone number", icon: Phone, color: "text-red-400" });
  else if (!vendor.phone_verified) gaps.push({ label: "Phone not verified", icon: Phone, color: "text-amber-400" });
  if (verLevel < 1) gaps.push({ label: "Email not confirmed", icon: Mail, color: "text-red-400" });
  if (verLevel < 2) gaps.push({ label: "ID not verified", icon: Shield, color: "text-amber-400" });
  if (verLevel < 3) gaps.push({ label: "Address not verified", icon: MapPin, color: "text-amber-400" });
  return gaps;
}

export default async function VerificationAuditPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const { data: rawVendors } = await db
    .from("vendors")
    .select("*, profile:profiles(full_name, email)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const vendors = (rawVendors ?? []).map((v) => ({
    ...v,
    _gaps: getGaps(v),
  })).sort((a, b) => b._gaps.length - a._gaps.length); // most gaps first

  const fullyVerified = vendors.filter((v) => v._gaps.length === 0).length;
  const partiallyVerified = vendors.filter((v) => v._gaps.length > 0 && v._gaps.length <= 2).length;
  const unverified = vendors.filter((v) => v._gaps.length >= 3).length;

  return (
    <DashboardLayout user={{ id: auth.user.id, email: auth.user.email ?? "", role: "admin", full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, phone_verified: profile?.phone_verified ?? false, avatar_url: profile?.avatar_url ?? null, created_at: profile?.created_at ?? new Date().toISOString() }} adminRole={auth.role}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-blue-400" />
              Verification Audit
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Every approved vendor should carry verification evidence before displaying trust badges.
            </p>
          </div>
          <Link href="/admin/verifications" className="btn-secondary text-xs py-2">
            Verification Queue <ChevronRight size={13} />
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Fully Verified",
              value: fullyVerified,
              sub: "Phone + ID + Address",
              icon: BadgeCheck,
              color: "text-emerald-400",
              bg: "bg-emerald-500/8 border-emerald-500/20",
            },
            {
              label: "Partially Verified",
              value: partiallyVerified,
              sub: "Missing 1–2 checks",
              icon: AlertTriangle,
              color: "text-amber-400",
              bg: "bg-amber-500/8 border-amber-500/20",
            },
            {
              label: "Needs Verification",
              value: unverified,
              sub: "Missing 3+ checks",
              icon: XCircle,
              color: "text-red-400",
              bg: "bg-red-500/8 border-red-500/20",
            },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={14} className={stat.color} />
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Policy reminder */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 text-sm text-slate-400">
          <p className="font-semibold text-white mb-1">Policy: No verification → no trust badge</p>
          <p>
            Vendors at verification level 0 or 1 should not display <strong>ID Verified</strong>,
            <strong> Address Verified</strong>, or <strong>Business Verified</strong> badges.
            Level 1 (email confirmed) grants no customer-visible badge by design.
            Use the Send Reminder button to chase outstanding verifications.
          </p>
        </div>

        {/* Vendor list */}
        {vendors.length === 0 ? (
          <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold">No approved vendors yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/6">
                  <th className="text-left pb-3 pr-4 w-[28%]">Vendor</th>
                  <th className="text-center pb-3 px-2">Phone</th>
                  <th className="text-center pb-3 px-2">Email</th>
                  <th className="text-center pb-3 px-2">ID</th>
                  <th className="text-center pb-3 px-2">Address</th>
                  <th className="text-center pb-3 px-2">Gaps</th>
                  <th className="text-right pb-3 pl-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {vendors.map((vendor) => {
                  const vProfile = vendor.profile as { full_name?: string; email?: string } | null;
                  const verLevel = Number(vendor.verification_level ?? 0);
                  const hasPhone = !!(vendor.phone as string | null);
                  const phoneVerified = !!(vendor.phone_verified as boolean);
                  const emailConfirmed = verLevel >= 1;
                  const idVerified = verLevel >= 2;
                  const addressVerified = verLevel >= 3;
                  const gapCount = vendor._gaps.length;

                  function Cell({ ok, partial }: { ok: boolean; partial?: boolean }) {
                    if (ok) return <CheckCircle2 size={15} className="text-emerald-400 mx-auto" />;
                    if (partial) return <AlertTriangle size={15} className="text-amber-400 mx-auto" />;
                    return <XCircle size={15} className="text-red-400 mx-auto" />;
                  }

                  return (
                    <tr key={String(vendor.id)} className={gapCount >= 3 ? "bg-red-500/3" : gapCount >= 1 ? "bg-amber-500/3" : ""}>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-white">{String(vendor.business_name)}</div>
                        <div className="text-xs text-slate-500">{vProfile?.email}</div>
                        <div className="text-xs text-slate-600">Joined {formatDate(String(vendor.created_at))}</div>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <Cell ok={hasPhone && phoneVerified} partial={hasPhone && !phoneVerified} />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <Cell ok={emailConfirmed} />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <Cell ok={idVerified} />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <Cell ok={addressVerified} />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`text-xs font-bold ${
                          gapCount === 0 ? "text-emerald-400"
                          : gapCount <= 2 ? "text-amber-400"
                          : "text-red-400"
                        }`}>
                          {gapCount === 0 ? "✓ Clean" : `${gapCount} gap${gapCount > 1 ? "s" : ""}`}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/vendors/${String(vendor.id)}`}
                            target="_blank"
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors"
                          >
                            View
                          </Link>
                          {gapCount === 0
                            ? <span className="text-xs text-emerald-400">Verified</span>
                            : (
                              <Link
                                href={`/admin/vendors?search=${encodeURIComponent(String(vendor.business_name))}`}
                                className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded border border-brand-500/30 hover:border-brand-500/50 transition-colors"
                              >
                                Manage
                              </Link>
                            )
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

