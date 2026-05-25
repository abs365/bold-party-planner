import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("*")
    .eq("id", id)
    .single();

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant = thread.customer_id === user.id || (vendor && thread.vendor_id === vendor.id);
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: messages } = await supabase
    .from("messages")
    .select("*, sender:profiles(id, full_name, avatar_url)")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  // Mark as read
  if (vendor && thread.vendor_id === vendor.id) {
    await supabase.from("messages").update({ read_by_vendor: true }).eq("thread_id", id).eq("read_by_vendor", false);
  } else {
    await supabase.from("messages").update({ read_by_customer: true }).eq("thread_id", id).eq("read_by_customer", false);
  }

  return NextResponse.json({ thread, messages: messages ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json() as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  const { data: thread } = await supabase.from("message_threads").select("*").eq("id", id).single();
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  const isCustomer = thread.customer_id === user.id;
  const isVendor = vendor && thread.vendor_id === vendor.id;
  if (!isCustomer && !isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      thread_id: id,
      sender_id: user.id,
      content: content.trim(),
      read_by_customer: isCustomer,
      read_by_vendor: !!isVendor,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", id);

  return NextResponse.json(message);
}
