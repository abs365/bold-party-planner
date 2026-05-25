import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeParseBody, createInvitationSchema } from "@/lib/validate";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("invitations")
    .select(`*, event:events(id, title, date, city, venue_name, venue_address, event_type, guest_count)`)
    .eq("event_id", event_id)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const invitationIds = (data ?? []).map((i) => i.id);
  let responses: Record<string, unknown>[] = [];
  if (invitationIds.length > 0) {
    const { data: rsvps } = await supabase
      .from("rsvp_responses")
      .select("*")
      .in("invitation_id", invitationIds)
      .order("created_at", { ascending: false });
    responses = rsvps ?? [];
  }

  return NextResponse.json({ invitations: data ?? [], responses });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = safeParseBody(createInvitationSchema, body);
  if (!result.data) return NextResponse.json({ error: result.error ?? "Invalid input" }, { status: 400 });
  const parsed = result.data;

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", parsed.event_id)
    .eq("customer_id", user.id)
    .single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      ...parsed,
      customer_id: user.id,
      title: parsed.title || event.title,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
