import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

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

  const { data: thread } = await supabase.from("message_threads").select("*").eq("id", id).maybeSingle();
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  const isCustomer = thread.customer_id === user.id;
  const isVendor = vendor && thread.vendor_id === vendor.id;
  if (!isCustomer && !isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Dedup: only email if recipient has no existing unread messages in this thread
  const readField = isCustomer ? "read_by_vendor" : "read_by_customer";
  const { count: priorUnread } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", id)
    .eq(readField, false);
  const shouldEmail = (priorUnread ?? 0) === 0;

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

  if (shouldEmail) {
    const db = await createAdminClient();
    void (async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
      if (isCustomer) {
        const { data: vendorData } = await db.from("vendors")
          .select("user_id, business_name")
          .eq("id", thread.vendor_id)
          .maybeSingle();
        if (!vendorData) return;
        const [{ data: vendorProfile }, { data: senderProfile }] = await Promise.all([
          db.from("profiles").select("email, full_name").eq("id", vendorData.user_id).maybeSingle(),
          db.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        ]);
        if (!vendorProfile?.email) return;
        const { sendNewMessageToVendor } = await import("@/lib/resend");
        await sendNewMessageToVendor(
          vendorProfile.email,
          vendorProfile.full_name ?? vendorData.business_name,
          senderProfile?.full_name ?? "A customer",
          content.trim(),
          `${appUrl}/vendor/messages?thread=${id}`
        );
      } else {
        const [{ data: customerProfile }, { data: vendorData }] = await Promise.all([
          db.from("profiles").select("email, full_name").eq("id", thread.customer_id).maybeSingle(),
          db.from("vendors").select("business_name").eq("id", thread.vendor_id).maybeSingle(),
        ]);
        if (!customerProfile?.email) return;
        const { sendNewMessageToCustomer } = await import("@/lib/resend");
        await sendNewMessageToCustomer(
          customerProfile.email,
          customerProfile.full_name ?? "there",
          vendorData?.business_name ?? "Your vendor",
          content.trim(),
          `${appUrl}/dashboard/messages?thread=${id}`
        );
      }
    })();
  }

  return NextResponse.json(message);
}
