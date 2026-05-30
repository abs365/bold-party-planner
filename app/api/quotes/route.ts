import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { scoreLead } from "@/lib/ai/scoring";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const quoteSchema = z.object({
  vendor_id: z.string().uuid(),
  event_id: z.string().uuid().optional(),
  message: z.string().max(2000).optional(),
  requirements: z.string().max(2000).optional(),
  event_date: z.string().optional(),
  event_type: z.string().optional(),
  guest_count: z.number().int().min(1).max(10000).optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "customer";

  let query = supabase.from("quotes").select(`
    *,
    vendor:vendors(id, business_name, category, city, rating, media:vendor_media(url, is_cover)),
    customer:profiles(id, full_name, avatar_url),
    event:events(id, title, date),
    response:quote_responses(*)
  `);

  if (role === "vendor") {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
    if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });
    query = query.eq("vendor_id", vendor.id);
  } else {
    query = query.eq("customer_id", user.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const identifier = user?.id ?? getClientIp(req);
  const rlHour = rateLimit({ identifier: `quotes:hr:${identifier}`, limit: 20, windowMs: 60 * 60_000 });
  const rlDay  = rateLimit({ identifier: `quotes:day:${identifier}`, limit: 100, windowMs: 24 * 60 * 60_000 });

  if (!rlHour.allowed || !rlDay.allowed) {
    const rl = !rlHour.allowed ? rlHour : rlDay;
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { vendor_id, ...rest } = parsed.data;

  // Check vendor is approved
  const { data: vendor } = await supabase.from("vendors").select("id, status, user_id").eq("id", vendor_id).maybeSingle();
  if (!vendor || vendor.status !== "approved") {
    return NextResponse.json({ error: "Vendor not available" }, { status: 400 });
  }

  // Prevent quoting own vendor profile
  if (vendor.user_id === user.id) {
    return NextResponse.json({ error: "Cannot request quote from yourself" }, { status: 400 });
  }

  const lead_score = scoreLead({
    budget_max: rest.budget_max ?? null,
    guest_count: rest.guest_count ?? null,
    event_date: rest.event_date ?? null,
  });

  const { data, error } = await supabase
    .from("quotes")
    .insert({ customer_id: user.id, vendor_id, ...rest, lead_score, routed_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void createAuditLog({
    actorUserId: user.id,
    actorRole: "customer",
    action: "quote.created",
    entityType: "quote",
    entityId: data.id,
    ipAddress: ipFromRequest(req),
  });
  void track({
    event: "quote.requested",
    userId: user.id,
    properties: { vendor_id, event_id: rest.event_id ?? null, lead_score },
  });

  // Notify vendor
  void supabase.rpc("notify_user", {
    p_user_id: vendor.user_id,
    p_title: "New Quote Request",
    p_message: `You have a new quote request. Respond within 7 days.`,
    p_type: "booking",
    p_link: `/vendor/quotes`,
  });

  return NextResponse.json(data, {
    headers: {
      "X-RateLimit-Limit": "20",
      "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
      "X-RateLimit-Reset": String(Math.ceil(Math.min(rlHour.resetAt, rlDay.resetAt) / 1000)),
    },
  });
}
