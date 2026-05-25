import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InvitationBuilder } from "@/components/invitations/InvitationBuilder";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Invitation, RSVPResponse } from "@/types";

export const dynamic = "force-dynamic";

export default async function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "customer") redirect("/dashboard");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, city")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();
  if (!event) notFound();

  const { data: invitations } = await supabase
    .from("invitations")
    .select(`*, event:events(id, title, date, city, venue_name, event_type, guest_count)`)
    .eq("event_id", id)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const invitationIds = (invitations ?? []).map((i) => i.id);
  let responses: RSVPResponse[] = [];
  if (invitationIds.length > 0) {
    const { data } = await supabase
      .from("rsvp_responses")
      .select("*")
      .in("invitation_id", invitationIds)
      .order("created_at", { ascending: false });
    responses = (data ?? []) as RSVPResponse[];
  }

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/events/${id}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={15} />
            Back to Event
          </Link>
        </div>

        <InvitationBuilder
          eventId={id}
          eventTitle={event.title}
          initialInvitations={(invitations ?? []) as Invitation[]}
          initialResponses={responses}
        />
      </div>
    </DashboardLayout>
  );
}
