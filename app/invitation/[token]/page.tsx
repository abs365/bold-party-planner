import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicInvitationPage } from "@/components/invitations/PublicInvitationPage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("title, event:events(title, date, city)")
    .eq("rsvp_token", token)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Invitation" };

  const event = data.event as { title?: string; date?: string; city?: string } | null;
  return {
    title: data.title || event?.title || "You're Invited!",
    description: `You've been invited to ${event?.title ?? "an event"}${event?.city ? ` in ${event.city}` : ""}.`,
    openGraph: {
      title: data.title || event?.title || "You're Invited!",
      type: "website",
    },
  };
}

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select(`*, event:events(id, title, date, start_time, city, venue_name, venue_address, event_type, guest_count, theme)`)
    .eq("rsvp_token", token)
    .eq("is_active", true)
    .single();

  if (!invitation) notFound();

  return <PublicInvitationPage invitation={invitation} token={token} />;
}
