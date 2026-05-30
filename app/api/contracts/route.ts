import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("booking_id");

  const query = supabase
    .from("contracts")
    .select(`
      *,
      booking:bookings(id, status, total_amount, event:events(title, date), vendor:vendors(business_name))
    `);

  if (bookingId) {
    const { data, error } = await query.eq("booking_id", bookingId).maybeSingle();
    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data, error } = await query
    .or(`customer_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contract_id, action } = await req.json() as { contract_id: string; action: string };
  if (!contract_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contract_id)
    .maybeSingle();

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();

  if (action === "customer_accept" && contract.customer_id === user.id) {
    const now = new Date().toISOString();
    const newStatus = contract.vendor_accepted_at ? "both_signed" : "customer_signed";
    const { error } = await supabase
      .from("contracts")
      .update({ customer_accepted_at: now, status: newStatus })
      .eq("id", contract_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: newStatus });
  }

  if (action === "vendor_accept" && vendor && contract.vendor_id === vendor.id) {
    const now = new Date().toISOString();
    const newStatus = contract.customer_accepted_at ? "both_signed" : "vendor_signed";
    const { error } = await supabase
      .from("contracts")
      .update({ vendor_accepted_at: now, status: newStatus })
      .eq("id", contract_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: newStatus });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
