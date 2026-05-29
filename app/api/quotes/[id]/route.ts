import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("quotes")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city, rating, bio, media:vendor_media(url, is_cover, type), packages:vendor_packages(id, name, price, includes)),
      customer:profiles(id, full_name, avatar_url),
      event:events(id, title, date, city, guest_count),
      response:quote_responses(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isCustomer = data.customer_id === user.id;
  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  const isVendor = vendor && data.vendor_id === vendor.id;

  if (!isCustomer && !isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, price, message, includes, valid_until, status } = body as Record<string, unknown>;

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: vendor } = await supabase.from("vendors").select("id, user_id").eq("user_id", user.id).maybeSingle();

  if (action === "respond" && vendor && quote.vendor_id === vendor.id) {
    // Vendor responding to quote
    if (!price || Number(price) <= 0) {
      return NextResponse.json({ error: "Price is required" }, { status: 400 });
    }
    const deposit = Number(price) * 0.3;
    const { data: response, error } = await supabase
      .from("quote_responses")
      .upsert({
        quote_id: id,
        vendor_id: vendor.id,
        price: Number(price),
        deposit_amount: deposit,
        message: String(message ?? ""),
        includes: Array.isArray(includes) ? includes : [],
        valid_until: valid_until ? String(valid_until) : null,
        status: "pending",
      }, { onConflict: "quote_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("quotes").update({ status: "responded", responded_at: new Date().toISOString() }).eq("id", id);

    void supabase.rpc("notify_user", {
      p_user_id: quote.customer_id,
      p_title: "Quote Response Received",
      p_message: `A vendor has responded to your quote request.`,
      p_type: "booking",
      p_link: `/dashboard/quotes/${id}`,
    });

    return NextResponse.json(response);
  }

  if (action === "view" && quote.customer_id === user.id) {
    await supabase.from("quotes").update({ viewed_at: new Date().toISOString() }).eq("id", id).is("viewed_at", null);
    return NextResponse.json({ success: true });
  }

  if (action === "accept" && quote.customer_id === user.id) {
    // Customer accepting a quote → create booking
    const { data: response } = await supabase
      .from("quote_responses")
      .select("*")
      .eq("quote_id", id)
      .maybeSingle();

    if (!response) return NextResponse.json({ error: "No response to accept" }, { status: 400 });

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_id: quote.customer_id,
        vendor_id: quote.vendor_id,
        event_id: quote.event_id,
        total_amount: response.price,
        deposit_amount: response.deposit_amount ?? Number(response.price) * 0.3,
        vendor_payout: response.price * 0.9,
        commission_amount: response.price * 0.1,
        status: "confirmed",
        payment_status: "pending",
        notes: `Created from quote. Requirements: ${quote.requirements ?? "None"}`,
      })
      .select()
      .single();

    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });

    await supabase.from("quote_responses").update({ status: "accepted" }).eq("id", response.id);
    await supabase.from("quotes").update({ status: "converted", converted_booking_id: booking.id }).eq("id", id);

    return NextResponse.json({ booking });
  }

  if (action === "decline" && quote.customer_id === user.id) {
    await supabase.from("quotes").update({ status: "declined" }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  if (action === "update_status" && typeof status === "string") {
    await supabase.from("quotes").update({ status }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
