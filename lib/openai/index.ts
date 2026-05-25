import OpenAI from "openai";
import type { EventType, VendorCategory, AIEventPlan } from "@/types";

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateEventPlan(params: {
  eventType: EventType;
  guestCount: number;
  budget: number;
  city: string;
  theme?: string;
  notes?: string;
  date: string;
}): Promise<AIEventPlan> {
  const openai = getOpenAI();

  const prompt = `You are an expert UK event planner. Create a comprehensive event plan for:
- Event Type: ${params.eventType.replace("_", " ")}
- Guest Count: ${params.guestCount}
- Budget: £${params.budget}
- Location: ${params.city}, UK
- Theme: ${params.theme || "Not specified"}
- Date: ${params.date}
- Notes: ${params.notes || "None"}

Return ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence overview of the event plan",
  "vendors_needed": [
    {"category": "dj", "priority": "essential", "reason": "why needed"}
  ],
  "budget_breakdown": [
    {"category": "Venue", "amount": 500, "percentage": 20}
  ],
  "timeline": [
    {"time": "6 weeks before", "task": "Book venue and caterer"}
  ],
  "checklist": [
    {"category": "Venue", "items": ["Confirm venue capacity", "Check parking"]}
  ],
  "tips": ["Tip 1", "Tip 2"],
  "risks": ["Risk 1", "Risk 2"]
}

For vendors_needed, only use these categories: dj, decorator, caterer, photographer, videographer, mc, security, usher, makeup_artist, cake_maker, balloon_decorator, lighting_stage, furniture_rental, marquee_rental, live_band, luxury_services, transport, cleaner, event_staff.
Make budget_breakdown percentages add up to 100. Be specific and practical. Include at least 8 timeline items, 5 checklist categories, 5 tips, and 3 risks.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from AI");
  return JSON.parse(content) as AIEventPlan;
}

export async function getVendorRecommendations(
  category: VendorCategory,
  eventType: EventType,
  budget: number,
  guestCount: number
): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Give 3 brief tips for hiring a ${category} for a ${eventType} event with ${guestCount} guests and £${budget} budget in the UK. Be concise and practical.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? "";
}
