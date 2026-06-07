import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MessageSquare, Star, User, Briefcase, Calendar } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

// ── Types ─────────────────────────────────────────────────────────────────────

type FeedbackRow = {
  id: string;
  user_id: string;
  type: "customer" | "vendor";
  created_at: string;
  additional_comments?: string | null;
  // Customer fields
  q_finding_vendors?: number | null;
  q_requesting?: number | null;
  q_comparing?: number | null;
  q_trust?: number | null;
  q_use_again?: number | null;
  // Vendor fields
  q_onboarding?: number | null;
  q_verification?: number | null;
  q_quoting?: number | null;
  q_recommend?: number | null;
  missing_features?: string | null;
  profile?: { full_name: string | null; email: string | null } | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Stars({ n }: { n: number | null | undefined }) {
  if (!n) return <span className="text-slate-700 text-xs">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={i <= n ? "text-amber-400 fill-amber-400" : "text-slate-700"}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{n}/5</span>
    </div>
  );
}

function avg(rows: FeedbackRow[], ...keys: (keyof FeedbackRow)[]): string {
  const nums = rows.flatMap((r) =>
    keys.map((k) => r[k] as number | null).filter((v): v is number => v != null)
  );
  if (nums.length === 0) return "—";
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle();

  const db = await createAdminClient();
  const { data: rawFeedback } = await db
    .from("pilot_feedback")
    .select("*, profile:profiles(full_name, email)")
    .order("created_at", { ascending: false });

  const feedback = (rawFeedback ?? []) as FeedbackRow[];
  const customerFeedback = feedback.filter((f) => f.type === "customer");
  const vendorFeedback   = feedback.filter((f) => f.type === "vendor");

  const vendorProfileUser = (profile ?? {
    id: user.id, email: user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  return (
    <DashboardLayout user={vendorProfileUser}>
      <div className="max-w-5xl mx-auto space-y-8 pb-10">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-amber-400" />
            User Feedback
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-light">
            Real feedback from customers and vendors — {feedback.length} response{feedback.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {/* Summary cards */}
        {feedback.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Customer summary */}
            <div className="bg-white/3 border border-white/6 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={13} className="text-blue-400" />
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Customer Feedback ({customerFeedback.length})
                </h2>
              </div>
              {customerFeedback.length === 0 ? (
                <p className="text-xs text-slate-600 font-light">No customer responses yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { label: "Finding vendors", keys: ["q_finding_vendors"] as (keyof FeedbackRow)[] },
                    { label: "Requesting quotes", keys: ["q_requesting"] as (keyof FeedbackRow)[] },
                    { label: "Comparing quotes", keys: ["q_comparing"] as (keyof FeedbackRow)[] },
                    { label: "Trust in platform", keys: ["q_trust"] as (keyof FeedbackRow)[] },
                    { label: "Would use again", keys: ["q_use_again"] as (keyof FeedbackRow)[] },
                  ].map(({ label, keys }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-light">{label}</span>
                      <Stars n={parseFloat(avg(customerFeedback, ...keys)) || null} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vendor summary */}
            <div className="bg-white/3 border border-white/6 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={13} className="text-amber-400" />
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Vendor Feedback ({vendorFeedback.length})
                </h2>
              </div>
              {vendorFeedback.length === 0 ? (
                <p className="text-xs text-slate-600 font-light">No vendor responses yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { label: "Onboarding ease", keys: ["q_onboarding"] as (keyof FeedbackRow)[] },
                    { label: "Verification process", keys: ["q_verification"] as (keyof FeedbackRow)[] },
                    { label: "Quoting system", keys: ["q_quoting"] as (keyof FeedbackRow)[] },
                    { label: "Would recommend", keys: ["q_recommend"] as (keyof FeedbackRow)[] },
                  ].map(({ label, keys }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-light">{label}</span>
                      <Stars n={parseFloat(avg(vendorFeedback, ...keys)) || null} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All responses */}
        {feedback.length === 0 ? (
          <div className="bg-white/3 border border-white/6 rounded-xl px-6 py-16 text-center">
            <MessageSquare size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-light">No feedback submitted yet.</p>
            <p className="text-slate-700 text-xs font-light mt-1">
              Feedback is submitted via /dashboard/feedback and /vendor/feedback.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
              All Responses — Most Recent First
            </h2>
            <div className="space-y-4">
              {feedback.map((f) => {
                const isCustomer = f.type === "customer";
                const name = f.profile?.full_name ?? f.profile?.email ?? "Anonymous";
                const date = new Date(f.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                });

                return (
                  <div
                    key={f.id}
                    className="bg-white/3 border border-white/6 rounded-xl p-5"
                  >
                    {/* Meta */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isCustomer ? "bg-blue-500/15" : "bg-amber-500/15"}`}>
                          {isCustomer
                            ? <User size={12} className="text-blue-400" />
                            : <Briefcase size={12} className="text-amber-400" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{name}</div>
                          <div className="text-xs text-slate-600 font-light capitalize">{f.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-light">
                        <Calendar size={10} />
                        {date}
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {isCustomer ? (
                        <>
                          {f.q_finding_vendors != null && <div><div className="text-xs text-slate-600 font-light mb-1">Finding vendors</div><Stars n={f.q_finding_vendors} /></div>}
                          {f.q_requesting    != null && <div><div className="text-xs text-slate-600 font-light mb-1">Requesting quotes</div><Stars n={f.q_requesting} /></div>}
                          {f.q_comparing     != null && <div><div className="text-xs text-slate-600 font-light mb-1">Comparing quotes</div><Stars n={f.q_comparing} /></div>}
                          {f.q_trust         != null && <div><div className="text-xs text-slate-600 font-light mb-1">Trust in platform</div><Stars n={f.q_trust} /></div>}
                          {f.q_use_again     != null && <div><div className="text-xs text-slate-600 font-light mb-1">Would use again</div><Stars n={f.q_use_again} /></div>}
                        </>
                      ) : (
                        <>
                          {f.q_onboarding  != null && <div><div className="text-xs text-slate-600 font-light mb-1">Onboarding</div><Stars n={f.q_onboarding} /></div>}
                          {f.q_verification!= null && <div><div className="text-xs text-slate-600 font-light mb-1">Verification</div><Stars n={f.q_verification} /></div>}
                          {f.q_quoting     != null && <div><div className="text-xs text-slate-600 font-light mb-1">Quoting system</div><Stars n={f.q_quoting} /></div>}
                          {f.q_recommend   != null && <div><div className="text-xs text-slate-600 font-light mb-1">Would recommend</div><Stars n={f.q_recommend} /></div>}
                        </>
                      )}
                    </div>

                    {/* Open text */}
                    {f.additional_comments && (
                      <div className="bg-white/3 rounded-lg px-4 py-3 mb-3">
                        <div className="text-xs text-slate-600 font-light mb-1">Additional comments</div>
                        <p className="text-sm text-slate-300 font-light leading-relaxed">
                          &ldquo;{f.additional_comments}&rdquo;
                        </p>
                      </div>
                    )}

                    {f.missing_features && (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-4 py-3">
                        <div className="text-xs text-amber-600 font-light mb-1">Missing features / suggestions</div>
                        <p className="text-sm text-amber-300 font-light leading-relaxed">
                          &ldquo;{f.missing_features}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
