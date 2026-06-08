import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Users, MessageSquare, CheckCircle2, Clock, ArrowRight, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: "New",         color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  in_progress: { label: "In Progress", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  matched:     { label: "Matched",     color: "text-violet-700",  bg: "bg-violet-50 border-violet-200" },
  completed:   { label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  closed:      { label: "Closed",      color: "text-gray-500",    bg: "bg-gray-50 border-gray-200" },
};

export default async function AdminConciergePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const db = await createAdminClient();
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Try to fetch concierge requests (table may not exist yet if migration hasn't run)
  const { data: requests, error } = await db
    .from("concierge_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const tableReady = !error;
  const items = (requests ?? []) as Array<{
    id: string; name: string; email: string; phone?: string;
    event_type: string; event_date?: string; location?: string;
    guest_count?: number; budget?: string; notes?: string;
    status: string; admin_notes?: string; created_at: string;
  }>;

  const newCount = items.filter((r) => r.status === "new").length;

  const counts = Object.fromEntries(
    Object.keys(STATUS_LABELS).map((s) => [s, items.filter((r) => r.status === s).length])
  );

  return (
    <DashboardLayout user={{ id: user.id, email: user.email ?? "", role: "admin", full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, phone_verified: profile?.phone_verified ?? false, avatar_url: profile?.avatar_url ?? null, created_at: profile?.created_at ?? new Date().toISOString() }}>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare size={20} className="text-brand-400" />
              Concierge Requests
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Customers who asked for personalised vendor matching.
              {newCount > 0 && <span className="text-amber-400 font-semibold ml-2">{newCount} new request{newCount > 1 ? "s" : ""} need attention.</span>}
            </p>
          </div>
        </div>

        {!tableReady && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-5 text-sm text-amber-300">
            <p className="font-semibold mb-1">Migration not yet applied</p>
            <p className="text-amber-400/70">Run migration <code>041_concierge_requests.sql</code> in Supabase to enable persistent storage. New concierge requests are still delivered by email until then.</p>
          </div>
        )}

        {tableReady && (
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(STATUS_LABELS).map(([key, cfg]) => (
              <div key={key} className="bg-white/4 border border-white/6 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{counts[key] ?? 0}</div>
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-full border inline-block ${cfg.bg} ${cfg.color}`}>{cfg.label}</div>
              </div>
            ))}
          </div>
        )}

        {tableReady && items.length === 0 && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
            <MessageSquare size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No concierge requests yet.</p>
            <p className="text-slate-600 text-sm mt-1">When customers submit the concierge form, requests appear here.</p>
          </div>
        )}

        {tableReady && items.length > 0 && (
          <div className="space-y-3">
            {items.map((req) => {
              const statusCfg = STATUS_LABELS[req.status] ?? STATUS_LABELS.new;
              return (
                <div key={req.id} className={`bg-white/4 border rounded-xl p-5 ${req.status === "new" ? "border-amber-500/25" : "border-white/6"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-white">{req.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {req.status === "new" && (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <Clock size={10} /> Needs response
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mb-3">
                        <span className="flex items-center gap-1"><Mail size={10} />{req.email}</span>
                        {req.phone && <span className="flex items-center gap-1"><Phone size={10} />{req.phone}</span>}
                        <span>{formatDate(req.created_at)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-300 font-medium">{req.event_type}</span>
                        {req.event_date && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-slate-400">
                            <Calendar size={10} />{req.event_date}
                          </span>
                        )}
                        {req.location && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-slate-400">
                            <MapPin size={10} />{req.location}
                          </span>
                        )}
                        {req.guest_count && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-slate-400">
                            <Users size={10} />{req.guest_count} guests
                          </span>
                        )}
                        {req.budget && (
                          <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-400">{req.budget}</span>
                        )}
                      </div>
                      {req.notes && (
                        <p className="text-xs text-slate-500 mt-3 italic leading-relaxed">
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a
                        href={`mailto:${req.email}`}
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-white/20 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Mail size={11} />Reply
                      </a>
                      <a
                        href={`/browse?city=${encodeURIComponent(req.location ?? "")}&event=${encodeURIComponent(req.event_type)}`}
                        target="_blank"
                        className="text-xs px-3 py-1.5 rounded-lg border border-brand-500/30 text-brand-400 hover:border-brand-500/50 transition-colors flex items-center gap-1"
                      >
                        Find Vendors <ArrowRight size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
