import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

const disputeSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  customer_evidence: z.string().max(2000).optional(),
  refund_amount: z.number().min(0).optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = isAdmin
    ? (await createAdminClient()).from("disputes").select(`
        *,
        booking:bookings(id, total_amount, event:events(title, date)),
        customer:profiles(id, full_name, email),
        vendor:vendors(id, business_name)
      `)
    : supabase.from("disputes").select("*").eq("customer_id", user.id);

  if (status) query = query.eq("status", status);
  const { data, error } = await (query as ReturnType<typeof query.order>).order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = disputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { booking_id, reason, description, customer_evidence, refund_amount } = parsed.data;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_id, vendor_id, vendor:vendors(user_id)")
    .eq("id", booking_id)
    .eq("customer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("disputes")
    .insert({
      booking_id,
      customer_id: user.id,
      vendor_id: booking.vendor_id,
      reason,
      description,
      customer_evidence: customer_evidence ?? null,
      refund_amount: refund_amount ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update booking status
  await supabase.from("bookings").update({ status: "disputed" }).eq("id", booking_id);

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    dispute_id: string;
    action: string;
    resolution?: string;
    admin_notes?: string;
    refund_amount?: number;
    vendor_response_text?: string;
  };

  const { dispute_id, action } = body;
  if (!dispute_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  if (action === "vendor_respond") {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
    if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

    await supabase.from("disputes")
      .update({ vendor_response_text: body.vendor_response_text, status: "investigating" })
      .eq("id", dispute_id)
      .eq("vendor_id", vendor.id);

    return NextResponse.json({ success: true });
  }

  if (action === "resolve" && isAdmin) {
    const adminClient = await createAdminClient();
    const updates: Record<string, unknown> = {
      status: "resolved",
      resolution: body.resolution,
      admin_notes: body.admin_notes,
      resolved_at: new Date().toISOString(),
      resolver_id: user.id,
    };

    if (typeof body.refund_amount === "number") {
      updates.refund_amount = body.refund_amount;
      updates.refund_status = "approved";
    }

    const { error } = await adminClient.from("disputes").update(updates).eq("id", dispute_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  }

  if (action === "close" && isAdmin) {
    const adminClient = await createAdminClient();
    await adminClient.from("disputes").update({ status: "closed", resolved_at: new Date().toISOString(), resolver_id: user.id }).eq("id", dispute_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
