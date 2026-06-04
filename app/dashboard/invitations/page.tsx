import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Mail, PartyPopper } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/invitations");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Invitations</h1>
          <p className="text-slate-400 text-sm mt-1">Event invitations you&apos;ve received or sent</p>
        </div>

        <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No invitations yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            When someone invites you to an event, or you invite guests to yours, those invitations will appear here.
          </p>
          <Link href="/dashboard/events" className="btn-primary">
            <PartyPopper size={15} />
            View My Events
          </Link>
        </div>

        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">About Invitations</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "??", title: "Received invitations", desc: "RSVPs and event invites from other planners" },
              { icon: "??", title: "Sent invitations", desc: "Track RSVPs from guests you have invited" },
              { icon: "???", title: "Calendar sync", desc: "Accept invites to add events to your calendar" },
              { icon: "??", title: "Custom messages", desc: "Personalised invite messages and reminders" },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-white/4 border border-white/6">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
