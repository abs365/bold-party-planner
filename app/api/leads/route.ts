import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routeLeadToVendors } from "@/lib/ai/lead-routing";

// POST /api/leads — trigger AI lead routing for a quote
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { quote_id?: string };
  if (!body.quote_id) return NextResponse.json({ error: "quote_id required" }, { status: 400 });

  // Verify caller owns the quote
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, customer_id")
    .eq("id", body.quote_id)
    .single();

  if (!quote || quote.customer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await routeLeadToVendors(body.quote_id);
  return NextResponse.json(result);
}

// GET /api/leads — get vendor's incoming leads with scoring
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, lead_count, conversion_count, response_rate")
    .eq("user_id", user.id)
    .single();

  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { data: leads } = await supabase
    .from("quotes")
    .select(`
      id, status, lead_score, created_at, expires_at, responded_at,
      budget_min, budget_max, guest_count, event_date, event_type, message,
      customer:profiles(id, full_name),
      event:events(id, title, date, city, guest_count)
    `)
    .eq("vendor_id", vendor.id)
    .order("lead_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    leads: leads ?? [],
    metrics: {
      total: leads?.length ?? 0,
      pending: leads?.filter((l) => l.status === "pending").length ?? 0,
      responded: leads?.filter((l) => l.status === "responded").length ?? 0,
      converted: leads?.filter((l) => l.status === "converted").length ?? 0,
      response_rate: vendor.response_rate,
      lead_count: vendor.lead_count,
      conversion_count: vendor.conversion_count,
    },
  });
}
