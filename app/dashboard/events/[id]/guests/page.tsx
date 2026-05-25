import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GuestListView } from "@/components/guests/GuestListView";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GuestManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "customer") redirect("/dashboard");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, city, guest_count")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();
  if (!event) notFound();

  const [guestsRes, statsRes] = await Promise.all([
    supabase
      .from("guests")
      .select("*")
      .eq("event_id", id)
      .order("is_vip", { ascending: false })
      .order("full_name"),
    supabase
      .from("event_guest_stats")
      .select("*")
      .eq("event_id", id)
      .single(),
  ]);

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/events/${id}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={15} />
            Back to Event
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={18} className="text-brand-400" />
              <h1 className="text-xl font-bold text-white">Guest Management</h1>
            </div>
            <p className="text-sm text-slate-400">
              {event.title} · {event.guest_count} expected guests
            </p>
          </div>
          <Link href={`/dashboard/events/${id}/invitations`} className="btn-secondary text-xs py-2 px-3">
            ✉️ Invitations
          </Link>
        </div>

        <GuestListView
          eventId={id}
          initialGuests={guestsRes.data ?? []}
          initialStats={statsRes.data ?? null}
        />
      </div>
    </DashboardLayout>
  );
}
