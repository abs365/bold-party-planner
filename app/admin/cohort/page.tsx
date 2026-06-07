import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { computeVendorReadinessScore } from "@/lib/vendor/completion";
import { VENDOR_CATEGORIES } from "@/types";
import {
  CheckCircle2, Clock, XCircle, AlertTriangle, Package,
  Camera, Shield, Phone, Star, ChevronRight, ArrowRight,
  Users, TrendingUp, Award,
} from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

// Priority vendors appear at the top regardless of score.
const PRIORITY_NAMES = ["mastaly", "baptist", "tinms"];

function recommendation(
  readiness: number,
  packageCount: number,
  mediaCount: number,
  bioLength: number,
): { label: string; color: string; bg: string } {
  if (readiness >= 50 && packageCount >= 1 && mediaCount >= 1)
    return { label: "Approve", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (readiness >= 35 && packageCount >= 1)
    return { label: "Approve w/ Caution", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" };
  if (packageCount >= 1 || readiness >= 20 || bioLength >= 50)
    return { label: "Needs Work", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" };
  return { label: "Decline", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
}

export default async function FounderCohortPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const db = await createAdminClient();
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Fetch all pending vendors with media + packages
  const { data: rawVendors } = await db
    .from("vendors")
    .select("*, media:vendor_media(*), packages:vendor_packages(*), profile:profiles(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const vendors = (rawVendors ?? []).map((v) => {
    const media = v.media as Array<{ url?: string; is_cover?: boolean }> | null;
    const packages = v.packages as Array<Record<string, unknown>> | null;
    const bio = (v.bio as string | null | undefined) ?? "";
    const score = computeVendorReadinessScore({
      mediaCount:        media?.length ?? 0,
      packageCount:      packages?.length ?? 0,
      verificationLevel: Number(v.verification_level ?? 0),
      bioLength:         bio.trim().length,
      hasPhone:          !!(v.phone as string | null),
      hasCity:           !!(v.city as string | null),
      hasSocial:         !!(v.instagram_url || v.website_url),
      responseRate:      Number(v.response_rate ?? 0),
    });
    const isPriority = PRIORITY_NAMES.some((n) =>
      String(v.business_name ?? "").toLowerCase().includes(n)
    );
    return { ...v, _score: score, _media: media, _packages: packages, _bio: bio, _isPriority: isPriority };
  }).sort((a, b) => {
    if (a._isPriority && !b._isPriority) return -1;
    if (!a._isPriority && b._isPriority) return 1;
    return b._score.total - a._score.total;
  });

  // Fetch count of approved vendors for cohort progress
  const { count: approvedCount } = await db
    .from("vendors")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const COHORT_TARGET = 10;
  const approveReady = vendors.filter((v) => {
    const rec = recommendation(v._score.total, v._packages?.length ?? 0, v._media?.length ?? 0, v._bio.trim().length);
    return rec.label === "Approve" || rec.label === "Approve w/ Caution";
  }).length;

  return (
    <DashboardLayout user={{ id: user.id, email: user.email ?? "", role: "admin", full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, phone_verified: profile?.phone_verified ?? false, avatar_url: profile?.avatar_url ?? null, created_at: profile?.created_at ?? new Date().toISOString() }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Award size={20} className="text-[#D4AF37]" />
              Founding Vendor Cohort
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Target: {COHORT_TARGET} approved vendors · {approvedCount ?? 0} approved so far · {approveReady} pending can be approved now
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/vendors?status=pending" className="btn-secondary text-xs py-2">
              Vendor Manager <ChevronRight size={13} />
            </Link>
            <Link href="/admin/founder" className="btn-secondary text-xs py-2">
              Founder Dashboard <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Cohort progress bar */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cohort Progress</span>
            <span className="text-sm font-bold text-white">{approvedCount ?? 0} / {COHORT_TARGET}</span>
          </div>
          <div className="bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-[#0B1F4D] to-[#D4AF37] transition-all duration-700"
              style={{ width: `${Math.min(100, ((approvedCount ?? 0) / COHORT_TARGET) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {COHORT_TARGET - (approvedCount ?? 0)} more vendors needed to reach target
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { label: "Approve", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
            { label: "Approve w/ Caution", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
            { label: "Needs Work", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
            { label: "Decline", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
          ].map((r) => (
            <span key={r.label} className={`px-2.5 py-1 rounded-full border font-medium ${r.bg} ${r.color}`}>
              {r.label}
            </span>
          ))}
          <span className="text-slate-500 self-center">· sorted by readiness score, priority vendors first</span>
        </div>

        {/* Queue table */}
        {vendors.length === 0 ? (
          <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold">No pending vendors</p>
            <p className="text-slate-400 text-sm mt-1">All applications have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/6">
                  <th className="text-left pb-3 pr-4">Vendor</th>
                  <th className="text-center pb-3 px-3">Readiness</th>
                  <th className="text-center pb-3 px-3">Verification</th>
                  <th className="text-center pb-3 px-3">Packages</th>
                  <th className="text-center pb-3 px-3">Photos</th>
                  <th className="text-center pb-3 px-3">Recommendation</th>
                  <th className="text-right pb-3 pl-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {vendors.map((vendor) => {
                  const mediaCount = vendor._media?.length ?? 0;
                  const packageCount = vendor._packages?.length ?? 0;
                  const cover = vendor._media?.find((m: { url?: string; is_cover?: boolean }) => m.is_cover) ?? vendor._media?.[0];
                  const vProfile = vendor.profile as { full_name?: string; email?: string } | null;
                  const cat = VENDOR_CATEGORIES[String(vendor.category) as keyof typeof VENDOR_CATEGORIES];
                  const verLevel = Number(vendor.verification_level ?? 0);
                  const rec = recommendation(vendor._score.total, packageCount, mediaCount, vendor._bio.trim().length);

                  const verLabel = verLevel >= 3 ? "Address ✓" : verLevel >= 2 ? "ID ✓" : verLevel >= 1 ? "Email ✓" : "None";
                  const verColor = verLevel >= 2 ? "text-emerald-400" : verLevel >= 1 ? "text-amber-400" : "text-red-400";

                  const scoreColor = vendor._score.total >= 50 ? "text-emerald-400"
                    : vendor._score.total >= 30 ? "text-amber-400"
                    : "text-red-400";

                  return (
                    <tr key={String(vendor.id)} className={`group ${vendor._isPriority ? "bg-[#D4AF37]/3" : ""}`}>
                      {/* Vendor */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            {cover?.url ? (
                              <Image src={String(cover.url)} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg">
                                {cat?.icon}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{String(vendor.business_name)}</span>
                              {vendor._isPriority && (
                                <Star size={11} className="text-[#D4AF37]" fill="currentColor" />
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {vProfile?.email} · {cat?.label ?? String(vendor.category)}
                            </div>
                            {!!vendor.city && (
                              <div className="text-xs text-slate-600">{String(vendor.city)}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Readiness */}
                      <td className="py-4 px-3 text-center">
                        <div className={`text-base font-bold ${scoreColor}`}>{vendor._score.total}%</div>
                        <div className="text-xs text-slate-500">{vendor._score.label}</div>
                      </td>

                      {/* Verification */}
                      <td className="py-4 px-3 text-center">
                        <div className={`text-xs font-medium ${verColor} flex items-center justify-center gap-1`}>
                          {verLevel >= 2 ? <Shield size={11} /> : verLevel >= 1 ? <Phone size={11} /> : <XCircle size={11} />}
                          {verLabel}
                        </div>
                        {!!vendor.phone && (
                          <div className={`text-xs mt-0.5 ${vendor.phone_verified ? "text-emerald-400" : "text-slate-500"}`}>
                            {vendor.phone_verified ? "Phone ✓" : "Phone unverified"}
                          </div>
                        )}
                      </td>

                      {/* Packages */}
                      <td className="py-4 px-3 text-center">
                        <div className={`flex items-center justify-center gap-1 text-sm font-semibold ${packageCount >= 1 ? "text-emerald-400" : "text-red-400"}`}>
                          <Package size={12} />
                          {packageCount}
                        </div>
                        {packageCount === 0 && <div className="text-xs text-red-400/70">Required</div>}
                      </td>

                      {/* Photos */}
                      <td className="py-4 px-3 text-center">
                        <div className={`flex items-center justify-center gap-1 text-sm font-semibold ${mediaCount >= 3 ? "text-emerald-400" : mediaCount >= 1 ? "text-amber-400" : "text-red-400"}`}>
                          <Camera size={12} />
                          {mediaCount}
                        </div>
                        {mediaCount < 3 && <div className="text-xs text-amber-400/70">Need 3+</div>}
                      </td>

                      {/* Recommendation */}
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${rec.bg} ${rec.color}`}>
                          {rec.label === "Approve" && <CheckCircle2 size={10} />}
                          {rec.label === "Approve w/ Caution" && <AlertTriangle size={10} />}
                          {rec.label === "Needs Work" && <Clock size={10} />}
                          {rec.label === "Decline" && <XCircle size={10} />}
                          {rec.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/vendors/${String(vendor.id)}`}
                            target="_blank"
                            className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded border border-white/10 hover:border-white/20 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/vendors?status=pending&search=${encodeURIComponent(String(vendor.business_name))}`}
                            className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1.5 rounded border border-brand-500/30 hover:border-brand-500/50 transition-colors flex items-center gap-1"
                          >
                            Approve <ArrowRight size={10} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Breakdown key */}
        <div className="bg-white/3 border border-white/5 rounded-xl p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-400 mb-2">Readiness Score Breakdown</p>
          <div className="grid grid-cols-3 gap-2">
            <span>Photos: 25 pts (5+ = full)</span>
            <span>Packages: 20 pts (2+ = full)</span>
            <span>Verification: 20 pts (Business = full)</span>
            <span>Description: 15 pts (100+ chars = full)</span>
            <span>Business Info: 10 pts (phone + city + social)</span>
            <span>Response Rate: 10 pts (80%+ = full)</span>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
