import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BadgeCheck, TrendingUp, Users, Wallet } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const adminClient = await createAdminClient();
  const { data: subs } = await adminClient
    .from("subscriptions")
    .select("*, vendor:vendors(business_name, user_id)")
    .order("created_at", { ascending: false });

  const activeSubs = (subs ?? []).filter((s) => s.status === "active");
  const proSubs = activeSubs.filter((s) => s.plan === "pro");
  const featuredSubs = activeSubs.filter((s) => s.plan === "featured");
  const mrr = proSubs.length * 29 + featuredSubs.length * 79;

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">Vendor subscription plans and recurring revenue</p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "Active Subscriptions", value: activeSubs.length, icon: BadgeCheck, color: "text-brand-400" },
            { label: "Pro Plan", value: proSubs.length, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Featured Plan", value: featuredSubs.length, icon: Users, color: "text-amber-400" },
            { label: "Est. MRR", value: `£${mrr}`, icon: Wallet, color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/4 border border-white/6 rounded-xl p-4">
              <stat.icon size={18} className={`${stat.color} mb-2`} />
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">All Subscriptions</h2>
          {(subs ?? []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No subscriptions yet.</p>
          ) : (
            <div className="space-y-2">
              {(subs ?? []).map((sub) => {
                const vendor = sub.vendor as { business_name?: string } | null;
                const planColors: Record<string, string> = {
                  active: "text-emerald-400 bg-emerald-500/10",
                  cancelled: "text-red-400 bg-red-500/10",
                  past_due: "text-amber-400 bg-amber-500/10",
                };
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/6">
                    <div>
                      <div className="text-sm font-medium text-white">{vendor?.business_name ?? "Unknown Vendor"}</div>
                      <div className="text-xs text-slate-500 capitalize">{sub.plan ?? "free"} plan</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColors[sub.status] ?? "text-slate-400 bg-white/8"}`}>
                        {sub.status}
                      </span>
                      <div className="text-xs text-slate-400">
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("en-GB") : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
