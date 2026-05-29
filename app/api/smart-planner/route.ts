import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEventPlan } from "@/lib/openai";
import { rateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import type { EventType } from "@/types";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ identifier: ip, ...RATE_LIMITS.ai });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { eventType, guestCount, budget, city, theme, notes, date } = body;

    if (!eventType || !guestCount || !budget || !city || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await generateEventPlan({
      eventType: eventType as EventType,
      guestCount: Number(guestCount),
      budget: Number(budget),
      city,
      theme,
      notes,
      date,
    });

    return NextResponse.json(plan);
  } catch (err: unknown) {
    console.error("Smart planner error:", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
