import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeParseBody, rsvpResponseSchema } from "@/lib/validate";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(`*, event:events(id, title, date, start_time, city, venue_name, venue_address, event_type, guest_count, theme)`)
    .eq("rsvp_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !invitation) {
    return NextResponse.json({ error: "Invitation not found or expired" }, { status: 404 });
  }

  // Track view (fire and forget)
  void supabase.from("invitation_views").insert({ invitation_id: invitation.id });
  void supabase.from("invitations").update({ view_count: (invitation.view_count ?? 0) + 1 }).eq("id", invitation.id);

  return NextResponse.json(invitation);
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, is_active, rsvp_count")
    .eq("rsvp_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found or expired" }, { status: 404 });
  }

  const body = await req.json();
  const { data: parsed, error: valErr } = safeParseBody(rsvpResponseSchema, body);
  if (valErr) return NextResponse.json({ error: valErr }, { status: 400 });

  const { data, error } = await supabase
    .from("rsvp_responses")
    .insert({ invitation_id: invitation.id, ...parsed })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment RSVP count
  void supabase
    .from("invitations")
    .update({ rsvp_count: (invitation.rsvp_count ?? 0) + 1 })
    .eq("id", invitation.id);

  return NextResponse.json(data, { status: 201 });
}
