import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEventPlan } from "@/lib/openai";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { EventType } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const identifier = user?.id ?? getClientIp(request);
    const rlMin = rateLimit({ identifier: `ai-planner:min:${identifier}`, limit: 10, windowMs: 60_000 });
    const rlHour = rateLimit({ identifier: `ai-planner:hr:${identifier}`, limit: 50, windowMs: 60 * 60_000 });

    if (!rlMin.allowed || !rlHour.allowed) {
      const rl = !rlMin.allowed ? rlMin : rlHour;
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": String(Math.min(rlMin.remaining, rlHour.remaining)),
            "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      );
    }

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

    return NextResponse.json(plan, {
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": String(Math.min(rlMin.remaining, rlHour.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(Math.min(rlMin.resetAt, rlHour.resetAt) / 1000)),
      },
    });
  } catch (err: unknown) {
    console.error("Smart planner error:", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
