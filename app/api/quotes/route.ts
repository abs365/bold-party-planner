import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { scoreLead } from "@/lib/ai/scoring";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const quoteSchema = z.object({
  vendor_id:   z.string().uuid(),
  event_id:    z.string().uuid().optional(),
  message:     z.string().max(2000).optional(),
  requirements:z.string().max(2000).optional(),
  notes:       z.string().max(2000).optional(),
  city:        z.string().max(200).optional(),
  category:    z.string().max(100).optional(),
  event_date:  z.string().optional(),
  event_type:  z.string().optional(),
  guest_count: z.number().int().min(1).max(10000).optional(),
  budget_min:  z.number().min(0).optional(),
  budget_max:  z.number().min(0).optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role     = searchParams.get("role")     ?? "customer";
  const eventId  = searchParams.get("event_id") ?? null;

  let query = supabase.from("quotes").select(`
    *,
    vendor:vendors(id, business_name, category, city, rating, review_count, verification_level,
      response_rate, completed_jobs_count, media:vendor_media(url, is_cover)),
    customer:profiles(id, full_name, avatar_url),
    event:events(id, title, date, city),
    response:quote_responses(*)
  `);

  if (role === "vendor") {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
    if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });
    query = query.eq("vendor_id", vendor.id);
  } else {
    query = query.eq("customer_id", user.id);
    if (eventId) query = query.eq("event_id", eventId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const identifier = user?.id ?? getClientIp(req);
  const rlHour = await rateLimit({ identifier: `quotes:hr:${identifier}`, limit: 20, windowMs: 60 * 60_000 });
  const rlDay  = await rateLimit({ identifier: `quotes:day:${identifier}`, limit: 100, windowMs: 24 * 60 * 60_000 });

  if (!rlHour.allowed || !rlDay.allowed) {
    const rl = !rlHour.allowed ? rlHour : rlDay;
    return NextResponse.json({ error: "Rate limit exceeded" }, {
      status: 429,
      headers: {
        "X-RateLimit-Limit": "20",
        "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
      },
    });
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { vendor_id, ...rest } = parsed.data;

  const { data: vendor } = await supabase
    .from("vendors").select("id, status, user_id").eq("id", vendor_id).maybeSingle();
  if (!vendor || vendor.status !== "approved") {
    return NextResponse.json({ error: "Vendor not available" }, { status: 400 });
  }
  if (vendor.user_id === user.id) {
    return NextResponse.json({ error: "Cannot request a quote from yourself" }, { status: 400 });
  }

  // Prevent duplicate pending quote to same vendor for same event
  if (rest.event_id) {
    const { data: existing } = await supabase
      .from("quotes")
      .select("id")
      .eq("customer_id", user.id)
      .eq("vendor_id", vendor_id)
      .eq("event_id", rest.event_id)
      .in("status", ["pending", "responded", "viewed", "shortlisted"])
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "You already have an open quote with this vendor for this event" },
        { status: 409 }
      );
    }
  }

  const lead_score = scoreLead({
    budget_max:  rest.budget_max  ?? null,
    guest_count: rest.guest_count ?? null,
    event_date:  rest.event_date  ?? null,
  });

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      customer_id: user.id,
      vendor_id,
      ...rest,
      lead_score,
      status: "pending",
      routed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit trail
  const db = await createAdminClient();
  void db.from("quote_events").insert({
    quote_id: data.id, actor_id: user.id, actor_role: "customer",
    event_type: "quote_created",
    details: { vendor_id, event_type: rest.event_type, lead_score },
  });

  void createAuditLog({
    actorUserId: user.id, actorRole: "customer",
    action: "quote.created", entityType: "quote", entityId: data.id,
    ipAddress: ipFromRequest(req),
  });
  void track({ event: "quote.requested", userId: user.id,
    properties: { vendor_id, event_id: rest.event_id ?? null, lead_score } });

  // In-app notification — vendor
  void supabase.rpc("notify_user", {
    p_user_id: vendor.user_id,
    p_title: "New Quote Request",
    p_message: "You have a new quote request. Review and respond within 7 days.",
    p_type: "booking",
    p_link: "/vendor/quotes",
  });

  // In-app notification — customer (confirms the request was received)
  void supabase.rpc("notify_user", {
    p_user_id: user.id,
    p_title: "Quote Request Sent",
    p_message: "Your quote request has been sent. You will be notified when the vendor responds.",
    p_type: "booking",
    p_link: `/dashboard/quotes/${data.id}`,
  });

  // Transactional emails — vendor and customer
  void (async () => {
    const [{ data: vendorContact }, { data: customerProfile }, { data: vendorInfo }] = await Promise.all([
      supabase.from("profiles").select("email, full_name").eq("id", vendor.user_id).maybeSingle(),
      supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle(),
      supabase.from("vendors").select("business_name").eq("id", vendor_id).maybeSingle(),
    ]);

    // Fetch event title if event_id was provided
    let eventTitle: string | null = null;
    if (rest.event_id) {
      const { data: eventRow } = await supabase.from("events").select("title").eq("id", rest.event_id).maybeSingle();
      eventTitle = eventRow?.title ?? null;
    }

    const vendorBusiness = vendorInfo?.business_name ?? vendorContact?.full_name ?? "the vendor";
    const customerName   = customerProfile?.full_name ?? "there";

    if (vendorContact?.email) {
      const { sendQuoteRequestToVendor } = await import("@/lib/resend");
      void sendQuoteRequestToVendor(
        vendorContact.email,
        vendorContact.full_name ?? "there",
        customerName,
        rest.event_type ?? "event",
        rest.event_date ?? null,
        rest.budget_max ?? null,
        data.id
      );
    }

    if (customerProfile?.email) {
      const { sendQuoteSubmittedToCustomer } = await import("@/lib/resend");
      void sendQuoteSubmittedToCustomer(
        customerProfile.email,
        customerName,
        vendorBusiness,
        rest.event_type ?? "event",
        rest.event_date ?? null,
        data.id,
        eventTitle
      );
    }
  })();

  return NextResponse.json(data, {
    headers: {
      "X-RateLimit-Limit": "20",
      "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
      "X-RateLimit-Reset": String(Math.ceil(Math.min(rlHour.resetAt, rlDay.resetAt) / 1000)),
    },
  });
}
