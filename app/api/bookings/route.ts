import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateCommission, generateInvoiceNumber } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog, ipFromRequest } from "@/lib/audit";

// REG-05: the direct "Book Now" path previously computed total_amount /
// deposit_amount / commission_amount / vendor_payout client-side
// (components/customer/BookingRequestForm.tsx) and inserted them straight
// into Supabase from the browser. The bookings_customer RLS policy has no
// WITH CHECK beyond `auth.uid() = customer_id`, so nothing server-side ever
// verified those figures matched the vendor's real package price - this
// route replaces that client insert, mirroring the server-computed pattern
// already proven correct in the quote-acceptance path
// (app/api/quotes/[id]/route.ts).
//
// Also folds in the availability enforcement deferred from REG-03: this is
// the other booking-creation entry point, so the same vendor-blocked-date
// check applies here.

const bookingSchema = z.object({
  event_id:   z.string().uuid(),
  vendor_id:  z.string().uuid(),
  package_id: z.string().uuid().optional().nullable(),
  notes:      z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = user.id ?? getClientIp(req);
  const rl = await rateLimit({ identifier: `bookings:hr:${identifier}`, limit: 20, windowMs: 60 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { event_id, vendor_id, package_id, notes } = parsed.data;

  const db = await createAdminClient();

  // Event must belong to this customer
  const { data: event } = await db
    .from("events")
    .select("id, date, customer_id")
    .eq("id", event_id)
    .maybeSingle();
  if (!event || event.customer_id !== user.id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Vendor must be approved
  const { data: vendor } = await db
    .from("vendors")
    .select("id, user_id, business_name, status, min_price, is_founding_vendor, founding_commission_expires_at")
    .eq("id", vendor_id)
    .maybeSingle();
  if (!vendor || vendor.status !== "approved") {
    return NextResponse.json({ error: "Vendor not available" }, { status: 400 });
  }

  // Honour a vendor-blocked date (REG-03's enforcement, extended to this path)
  if (event.date) {
    const { data: blockedDate } = await db
      .from("vendor_availability")
      .select("id")
      .eq("vendor_id", vendor_id)
      .eq("date", event.date)
      .eq("is_available", false)
      .maybeSingle();
    if (blockedDate) {
      return NextResponse.json(
        { error: "This vendor is not available on the event date. Please contact them or choose a different vendor." },
        { status: 409 }
      );
    }
  }

  // Real price, resolved server-side — never trust a client-submitted amount
  let totalAmount: number;
  if (package_id) {
    const { data: pkg } = await db
      .from("vendor_packages")
      .select("id, price, pricing_type, name")
      .eq("id", package_id)
      .eq("vendor_id", vendor_id)
      .maybeSingle();
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    totalAmount = pkg.price;
  } else if (vendor.min_price) {
    totalAmount = vendor.min_price;
  } else {
    return NextResponse.json({ error: "This vendor has no priced package to book" }, { status: 400 });
  }
  if (!totalAmount || totalAmount <= 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const depositAmount = Math.round(totalAmount * 0.3 * 100) / 100;
  // Rate is decided once, centrally, in getApplicableCommissionRate — this
  // vendor's founding status + waiver expiry are weighed against today's
  // date (a brand-new booking, so "now" is the correct booking date).
  const commission = calculateCommission(totalAmount, vendor);
  const vendorPayout = Math.round((totalAmount - commission) * 100) / 100;

  const { data: booking, error: bookErr } = await db
    .from("bookings")
    .insert({
      event_id,
      vendor_id,
      package_id: package_id ?? null,
      customer_id: user.id,
      status: "pending",
      payment_status: "pending",
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      commission_amount: commission,
      vendor_payout: vendorPayout,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 });

  await db.from("invoices").insert({
    booking_id: booking.id,
    invoice_number: generateInvoiceNumber(),
    customer_id: user.id,
    vendor_id,
    line_items: [{ description: vendor.business_name + " service", amount: totalAmount }],
    subtotal: totalAmount,
    commission,
    total: totalAmount,
    status: "draft",
  });

  void db.rpc("notify_user", {
    p_user_id: vendor.user_id,
    p_title: "New Booking Request",
    p_message: `You have a new booking request${event.date ? ` for ${event.date}` : ""}`,
    p_type: "booking",
    p_link: `/vendor/bookings/${booking.id}`,
  });

  void createAuditLog({
    actorUserId: user.id, actorRole: "customer",
    action: "booking.created", entityType: "booking", entityId: booking.id,
    after: { total_amount: totalAmount, vendor_id }, ipAddress: ipFromRequest(req),
  });

  return NextResponse.json(booking);
}
