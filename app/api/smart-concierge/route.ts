import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are the ELBOLD Events Smart Event Concierge â€” a premium, friendly event planning expert for the UK market.

You help customers plan exceptional events. You are warm, professional, and knowledgeable about UK event planning, vendors, pricing, and logistics.

Your expertise includes:
- Suggesting the right vendors for any event type
- UK-specific pricing guidance (be realistic about costs)
- Event timelines and planning milestones
- Decoration themes and style combinations
- Entertainment combinations that work well together
- Backup plans for common problems (weather, power, parking, security)
- Budget allocation advice
- Etiquette and logistics tips for UK events

Guidelines:
- Never use the word "AI" â€” you are the "Smart Concierge"
- Be warm, concise, and practical
- Give specific UK-relevant advice (mention Â£ for prices)
- Suggest categories the platform has: DJ, Photographer, Videographer, Caterer, Decorator, MC, Security, Makeup Artist, Cake Maker, Balloon Decorator, Lighting & Stage, Furniture Rental, Marquee Rental, Live Band, Transport
- When suggesting vendors, encourage customers to browse and request quotes on the platform
- Keep responses under 300 words unless asked for detailed plans
- Use bullet points for lists
- Be encouraging and make planning feel exciting, not overwhelming`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const identifier = user?.id ?? getClientIp(req);
  const rlMin = rateLimit({ identifier: `smart-concierge:min:${identifier}`, limit: 10, windowMs: 60_000 });
  const rlHour = rateLimit({ identifier: `smart-concierge:hr:${identifier}`, limit: 50, windowMs: 60 * 60_000 });

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

  const { message, event_id, history } = await req.json() as {
    message: string;
    event_id?: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  // Fetch event context if provided
  let eventContext = "";
  if (event_id) {
    const { data: event } = await supabase.from("events").select("title, date, city, guest_count, budget, event_type, notes").eq("id", event_id).eq("customer_id", user.id).single();
    if (event) {
      eventContext = `\n\nEvent context: "${event.title}" â€” ${event.event_type} on ${event.date} in ${event.city} for ${event.guest_count} guests with a budget of Â£${event.budget}. Notes: ${event.notes ?? "none"}.`;
    }
  }

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT + eventContext },
    ...(history ?? []).slice(-8),
    { role: "user", content: message },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 400,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "I'm unable to respond right now. Please try again.";

  // Save to chat history
  await supabase.from("smart_chat_history").insert([
    { user_id: user.id, event_id: event_id ?? null, role: "user", content: message },
    { user_id: user.id, event_id: event_id ?? null, role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply }, {
    headers: {
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": String(Math.min(rlMin.remaining, rlHour.remaining)),
      "X-RateLimit-Reset": String(Math.ceil(Math.min(rlMin.resetAt, rlHour.resetAt) / 1000)),
    },
  });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");

  let query = supabase.from("smart_chat_history").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(50);
  if (event_id) query = query.eq("event_id", event_id);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}
