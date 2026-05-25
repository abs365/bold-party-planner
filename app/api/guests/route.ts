import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeParseBody, createGuestSchema } from "@/lib/validate";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", event_id)
    .eq("customer_id", user.id)
    .single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("event_id", event_id)
    .order("is_vip", { ascending: false })
    .order("full_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: stats } = await supabase
    .from("event_guest_stats")
    .select("*")
    .eq("event_id", event_id)
    .single();

  return NextResponse.json({ guests: data ?? [], stats: stats ?? null });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = safeParseBody(createGuestSchema, body);
  if (!result.data) return NextResponse.json({ error: result.error ?? "Invalid input" }, { status: 400 });
  const parsed = result.data;

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", parsed.event_id)
    .eq("customer_id", user.id)
    .single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("guests")
    .insert({ ...parsed, customer_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
