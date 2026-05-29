import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const newThreadSchema = z.object({
  vendor_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  quote_id: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  first_message: z.string().min(1).max(2000),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();

  let query = supabase
    .from("message_threads")
    .select(`
      *,
      customer:profiles!message_threads_customer_id_fkey(id, full_name, avatar_url),
      vendor:vendors(id, business_name, media:vendor_media(url, is_cover)),
      messages(id, content, sender_id, created_at, read_by_customer, read_by_vendor)
    `)
    .order("last_message_at", { ascending: false });

  if (vendor) {
    query = query.eq("vendor_id", vendor.id);
  } else {
    query = query.eq("customer_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ ...RATE_LIMITS.messaging, identifier: `msg:${ip}` });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = newThreadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { vendor_id, booking_id, quote_id, subject, first_message } = parsed.data;

  const { data: vendor } = await supabase.from("vendors").select("id").eq("id", vendor_id).single();
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  // Check for existing thread
  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("customer_id", user.id)
    .eq("vendor_id", vendor_id)
    .eq(booking_id ? "booking_id" : "customer_id", booking_id ?? user.id)
    .single();

  let threadId = existing?.id;

  if (!threadId) {
    const { data: thread, error: threadErr } = await supabase
      .from("message_threads")
      .insert({ customer_id: user.id, vendor_id, booking_id: booking_id ?? null, quote_id: quote_id ?? null, subject: subject ?? null })
      .select("id")
      .single();
    if (threadErr) return NextResponse.json({ error: threadErr.message }, { status: 500 });
    threadId = thread.id;
  }

  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, content: first_message, read_by_customer: true })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);

  return NextResponse.json({ thread_id: threadId, message });
}
