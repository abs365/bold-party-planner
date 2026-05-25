// AI Automation Layer — Phase 1 (Rule-Based)
// Replace individual functions with ML models as data grows

import { createClient } from "@/lib/supabase/server";
import { matchVendorsForEvent } from "./vendor-match";

export interface RoutingDecision {
  routed: number;
  vendors: string[];
}

/**
 * Read a quote from the DB, find the top 5 matching vendors,
 * and insert quote records for vendors that don't already have
 * a quote for this event + category combination.
 *
 * Returns the number of new quote records inserted and their vendor IDs.
 */
export async function routeLeadToVendors(quoteId: string): Promise<RoutingDecision> {
  const supabase = await createClient();

  // 1. Fetch the source quote
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      "id, event_type, budget_max, guest_count, event_date, requirements, message, event_id, customer_id, event:events(city)"
    )
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return { routed: 0, vendors: [] };
  }

  const eventCity =
    (quote.event as { city?: string } | null)?.city ?? "";

  // 2. Find top 5 matching vendors
  const matches = await matchVendorsForEvent({
    eventType: quote.event_type ?? "",
    city: eventCity,
    category: quote.event_type ?? "", // category derived from event_type in Phase 1
    budget: quote.budget_max,
    guestCount: quote.guest_count,
    date: quote.event_date,
  });

  const topVendors = matches.slice(0, 5);
  if (topVendors.length === 0) return { routed: 0, vendors: [] };

  const vendorIds = topVendors.map((v) => v.vendorId);

  // 3. Find vendors that already have a quote for this event + category
  const { data: existingQuotes } = await supabase
    .from("quotes")
    .select("vendor_id")
    .eq("event_id", quote.event_id)
    .in("vendor_id", vendorIds);

  const alreadyRouted = new Set(
    (existingQuotes ?? []).map((q: { vendor_id: string }) => q.vendor_id)
  );

  const newVendors = topVendors.filter((v) => !alreadyRouted.has(v.vendorId));

  if (newVendors.length === 0) return { routed: 0, vendors: [] };

  // 4. Insert new quote records for each new vendor
  const inserts = newVendors.map((v) => ({
    customer_id: quote.customer_id,
    vendor_id: v.vendorId,
    event_id: quote.event_id,
    event_type: quote.event_type,
    event_date: quote.event_date,
    guest_count: quote.guest_count,
    budget_max: quote.budget_max,
    requirements: quote.requirements,
    message: quote.message,
    status: "pending",
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("quotes")
    .insert(inserts)
    .select("vendor_id");

  if (insertError || !inserted) return { routed: 0, vendors: [] };

  return {
    routed: inserted.length,
    vendors: inserted.map((q: { vendor_id: string }) => q.vendor_id),
  };
}
