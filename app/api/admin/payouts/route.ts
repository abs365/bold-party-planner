import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await createAdminClient();

  // Return all vendor_payouts records with booking + vendor context
  const { data, error } = await db
    .from("vendor_payouts")
    .select(`
      id, booking_id, vendor_id, amount, status, notes, created_at,
      booking:bookings(id, total_amount, commission_amount, vendor_payout, payment_status,
        event:events(title, date),
        customer:profiles!bookings_customer_id_fkey(full_name)
      ),
      vendor:vendors(id, business_name, city)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { payout_id, action, notes } = await request.json() as {
    payout_id: string;
    action: "mark_paid" | "cancel";
    notes?: string;
  };

  if (!payout_id || !action) {
    return NextResponse.json({ error: "Missing payout_id or action" }, { status: 400 });
  }

  const db = await createAdminClient();

  if (action === "mark_paid") {
    const { error } = await db
      .from("vendor_payouts")
      .update({
        status: "paid",
        notes: notes ?? null,
      })
      .eq("id", payout_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify vendor that their payout has been sent
    const { data: payout } = await db
      .from("vendor_payouts")
      .select("vendor_id, amount, booking_id")
      .eq("id", payout_id)
      .maybeSingle();

    if (payout?.vendor_id) {
      const { data: vendor } = await db
        .from("vendors")
        .select("user_id, business_name")
        .eq("id", payout.vendor_id)
        .maybeSingle();

      if (vendor?.user_id) {
        await db.rpc("notify_user", {
          p_user_id: vendor.user_id,
          p_title: "Payout Sent",
          p_message: `Your payout of £${Number(payout.amount).toFixed(2)} has been sent to your registered bank account.`,
          p_type: "payment",
          p_link: "/vendor/dashboard",
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  if (action === "cancel") {
    const { error } = await db
      .from("vendor_payouts")
      .update({ status: "cancelled", notes: notes ?? null })
      .eq("id", payout_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
