import { createAdminClient } from "@/lib/supabase/server";
import { Circle, Send, Clock, Star, CheckCircle2, Zap } from "lucide-react";

// Extracted from app/admin/vendor-growth/page.tsx (WP-D1, Programme D) so
// Founder Dashboard can reuse the already-computed `totals`/`appsThisWeek`
// snapshot instead of re-deriving vendor funnel counts a second time. Page
// files can only export the framework's allowed route exports, so this
// couldn't stay as a named export of the page module itself.
export async function fetchVendorGrowthData() {
  const db = await createAdminClient();
  const now  = new Date();
  const month = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  // All vendors with key fields
  const { data: allVendors } = await db
    .from("vendors")
    .select("id, category, city, status, subscription_plan, created_at")
    .order("created_at", { ascending: false });

  const vendors = allVendors ?? [];

  // Funnel counts
  const approved = vendors.filter(v => v.status === "approved");
  const pending   = vendors.filter(v => v.status === "pending");
  const rejected  = vendors.filter(v => v.status === "rejected");
  const all       = vendors;

  // Vendors with a booking
  const { data: bookedVendorIds } = await db
    .from("bookings")
    .select("vendor_id")
    .in("status", ["confirmed", "completed"]);

  const bookedSet = new Set((bookedVendorIds ?? []).map(b => b.vendor_id));
  const bookedVendors = approved.filter(v => bookedSet.has(v.id));

  // Active = approved + subscription not free OR has a booking
  const activeVendors = approved.filter(
    v => v.subscription_plan !== "free" || bookedSet.has(v.id)
  );

  // Category breakdown: approved
  const byCat: Record<string, number> = {};
  for (const v of approved) {
    byCat[v.category] = (byCat[v.category] ?? 0) + 1;
  }

  // Location breakdown: normalise city names
  const byLoc: Record<string, number> = { Essex: 0, Kent: 0, London: 0 };
  for (const v of approved) {
    const city = (v.city ?? "").toLowerCase();
    if (city.includes("essex") || ["chelmsford", "southend", "colchester", "basildon", "romford", "braintree", "harlow", "brentwood"].some(c => city.includes(c))) {
      byLoc["Essex"] = (byLoc["Essex"] ?? 0) + 1;
    } else if (city.includes("kent") || ["maidstone", "canterbury", "dover", "gillingham", "chatham", "tonbridge", "ashford", "sevenoaks", "sittingbourne", "dartford"].some(c => city.includes(c))) {
      byLoc["Kent"] = (byLoc["Kent"] ?? 0) + 1;
    } else if (city.includes("london") || ["hackney", "brixton", "islington", "camden", "peckham", "lewisham", "croydon", "greenwich", "lambeth"].some(c => city.includes(c))) {
      byLoc["London"] = (byLoc["London"] ?? 0) + 1;
    }
  }

  // Applications this week / month
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const appsThisWeek  = all.filter(v => v.created_at >= week).length;
  const appsThisMonth = all.filter(v => v.created_at >= month).length;

  // Stage-to-stage conversion (of the previous numeric stage, not of total) -
  // surfaces the actual drop-off point rather than just raw counts.
  const pctOf = (count: number, prevCount: number): string | null =>
    prevCount > 0 ? `${Math.round((count / prevCount) * 100)}% of previous stage` : null;

  const FUNNEL = [
    { stage: "Prospects",  count: "∞",              color: "text-slate-500",   note: "Vendors Elbold has not yet contacted",                  conversion: null as string | null },
    { stage: "Contacted",  count: "Manual",          color: "text-slate-400",   note: "Track in outreach tracker",                             conversion: null as string | null },
    { stage: "Interested", count: "Manual",          color: "text-slate-400",   note: "Track in outreach tracker",                             conversion: null as string | null },
    { stage: "Applied",    count: all.length,        color: "text-blue-400",    note: `${appsThisMonth} in last 30 days`,                       conversion: null as string | null },
    { stage: "Approved",   count: approved.length,   color: "text-amber-400",   note: `${rejected.length} rejected, ${pending.length} pending`, conversion: pctOf(approved.length, all.length) },
    { stage: "Active",     count: activeVendors.length, color: "text-emerald-400", note: "Paid plan or has booking",                            conversion: pctOf(activeVendors.length, approved.length) },
    { stage: "Booked",     count: bookedVendors.length, color: "text-purple-400",  note: "At least one confirmed booking",                      conversion: pctOf(bookedVendors.length, activeVendors.length) },
  ];

  // ── Vendor leads acquisition metrics ──────────────────────────────────────

  const today = new Date().toISOString().split("T")[0];
  const { data: allLeads } = await db
    .from("vendor_leads")
    .select("status, priority, next_follow_up_at, created_at");

  const leads = allLeads ?? [];
  const leadsNewToday    = leads.filter((l) => l.created_at.startsWith(today)).length;
  const leadsResearched  = leads.filter((l) => l.status === "researched").length;
  const leadsContacted   = leads.filter((l) => ["outreach_sent","responded"].includes(l.status)).length;
  const leadsFollowUpDue = leads.filter((l) => l.status === "follow_up_due" || (l.next_follow_up_at && l.next_follow_up_at < new Date().toISOString())).length;
  const leadsInterested  = leads.filter((l) => l.status === "interested").length;
  const leadsRegistered  = leads.filter((l) => l.status === "registered").length;
  const leadsApproved    = leads.filter((l) => l.status === "approved").length;
  const totalLeads       = leads.filter((l) => !["rejected","not_suitable"].includes(l.status)).length;

  const ACQUISITION_METRICS = [
    { label: "New Leads Today",   value: leadsNewToday,    target: 10, color: "#6366f1",  icon: Star },
    { label: "Researched",        value: leadsResearched,  target: 0,  color: "#3b82f6",  icon: Circle },
    { label: "Contacted",         value: leadsContacted,   target: 5,  color: "#7c3aed",  icon: Send },
    { label: "Follow-ups Due",    value: leadsFollowUpDue, target: 2,  color: "#ea580c",  icon: Clock },
    { label: "Interested",        value: leadsInterested,  target: 0,  color: "#16a34a",  icon: Star },
    { label: "Registered",        value: leadsRegistered,  target: 0,  color: "#059669",  icon: CheckCircle2 },
    { label: "Approved",          value: leadsApproved,    target: 2,  color: "#0B1F4D",  icon: Zap },
  ];

  return {
    funnel: FUNNEL,
    byCat,
    byLoc,
    appsThisWeek,
    appsThisMonth,
    totals: {
      all: all.length, approved: approved.length, pending: pending.length,
      rejected: rejected.length, active: activeVendors.length, booked: bookedVendors.length,
    },
    acquisition: {
      metrics: ACQUISITION_METRICS,
      totalLeads,
      leadsNewToday,
      leadsContacted,
      leadsFollowUpDue,
      leadsInterested,
      leadsRegistered,
      leadsApproved,
    },
  };
}
