import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = getClientIp(request);
    const rl = await rateLimit({ identifier: `events:${user.id ?? ip}`, limit: 30, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many events created. Try again later." }, { status: 429 });
    }

    const body = await request.json() as {
      title?: string;
      event_type?: string;
      date?: string;
      start_time?: string | null;
      city?: string;
      venue_name?: string | null;
      venue_address?: string | null;
      guest_count?: number;
      budget?: number;
      theme?: string | null;
      notes?: string | null;
      setting?: string;
      vendor_needs?: string[];
      ai_plan?: unknown;
    };

    const { title, event_type, date, city } = body;

    if (!title || !event_type || !date || !city) {
      return NextResponse.json(
        { error: "title, event_type, date, and city are required" },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        customer_id: user.id,
        title,
        event_type,
        date,
        start_time: body.start_time || null,
        city,
        venue_name: body.venue_name || null,
        venue_address: body.venue_address || null,
        guest_count: body.guest_count ?? 50,
        budget: body.budget ?? 1000,
        theme: body.theme || null,
        notes: body.notes || null,
        setting: body.setting ?? "indoor",
        vendor_needs: body.vendor_needs ?? [],
        status: "planning",
        ai_plan: body.ai_plan ?? null,
      })
      .select()
      .single();

    if (error) {
      logger.warn("events.create.failed", { userId: user.id, err: error });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    void track({
      event: "event.created",
      userId: user.id,
      properties: { event_id: event.id, event_type, city },
    });

    logger.info("events.created", { userId: user.id, eventId: event.id });
    return NextResponse.json(event);
  } catch (err) {
    logger.error("events.create.unexpected", { err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
