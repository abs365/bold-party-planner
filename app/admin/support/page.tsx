import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HelpCircle, MessageSquare, AlertCircle, Mail } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-slate-400 text-sm mt-1">Customer and vendor support queue</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Open Tickets", value: "0", icon: MessageSquare, color: "text-brand-400" },
            { label: "Escalations", value: "0", icon: AlertCircle, color: "text-red-400" },
            { label: "Avg. Response", value: "—", icon: HelpCircle, color: "text-emerald-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/4 border border-white/6 rounded-xl p-4">
              <stat.icon size={18} className={`${stat.color} mb-2`} />
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={28} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Support ticketing: coming soon</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            A full in-app support queue with ticket assignment, SLA tracking, and response templates is planned for the next phase.
          </p>
          <div className="flex gap-3 justify-center">
            <a href={`mailto:${ADMIN_EMAILS[0] ?? "admin@boldparty.co.uk"}`} className="btn-secondary">
              <Mail size={15} />
              Contact via Email
            </a>
          </div>
        </div>

        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Quick support actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { href: "/admin/disputes", label: "Review open disputes", desc: "Customer-vendor conflicts needing resolution" },
              { href: "/admin/verifications", label: "Pending verifications", desc: "Vendor ID and credential checks" },
              { href: "/admin/vendors", label: "Vendor management", desc: "Approve, suspend, or review vendor accounts" },
              { href: "/admin/customers", label: "Customer accounts", desc: "Look up users, flag suspicious activity" },
            ].map((action) => (
              <a key={action.href} href={action.href} className="p-4 rounded-xl border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all">
                <div className="text-sm font-semibold text-white mb-0.5">{action.label}</div>
                <div className="text-xs text-slate-400">{action.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
