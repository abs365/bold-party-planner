import { getOpenAI } from "@/lib/openai";

export interface LeadOutreachInput {
  business_name: string;
  category: string;
  city: string | null;
  region: string | null;
  website: string | null;
  instagram: string | null;
  lead_score: number;
  notes: string | null;
}

export interface OutreachMessages {
  first_contact_email: string;
  instagram_dm: string;
  facebook_message: string;
  follow_up_email: string;
  phone_script: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  dj: "DJ",
  decorator: "event decorator",
  photographer: "photographer",
  videographer: "videographer",
  caterer: "caterer",
  event_planner: "event planner",
  cake_maker: "cake maker",
  balloon_decorator: "balloon decorator",
  venue_hire: "venue",
  live_band: "live band",
  mc: "MC / host",
};

export async function generateOutreachMessages(lead: LeadOutreachInput): Promise<OutreachMessages> {
  const openai = getOpenAI();

  const categoryLabel = CATEGORY_LABELS[lead.category] ?? lead.category;
  const location = [lead.city, lead.region].filter(Boolean).join(", ") || "your area";

  const prompt = `You are writing vendor acquisition outreach for Elbold, a carefully curated event marketplace covering London, Kent and Essex.

Elbold is founder-led, not a big corporate platform. We are in early stage and building a carefully selected network of quality event professionals.

POSITIONING RULES (you must follow these exactly):
- Do NOT say "UK's leading marketplace"
- Do NOT say "thousands of customers" or imply large existing audience
- Do NOT say "huge vendor network" or "hundreds of vendors"
- Do NOT promise bookings or income guarantees
- DO say we are building a trusted, curated network
- DO say we verify every vendor individually
- DO say payment is protected by Stripe
- DO be founder-led and personal in tone
- DO be professional, friendly, and trust-first
- DO be honest about being an early-stage platform building quality over quantity

Vendor details:
- Business name: ${lead.business_name}
- Category: ${categoryLabel}
- Location: ${location}
- Website: ${lead.website ?? "not provided"}
- Instagram: ${lead.instagram ?? "not provided"}
- Additional notes: ${lead.notes ?? "none"}

Generate 5 outreach messages and return ONLY valid JSON:
{
  "first_contact_email": "Full professional email (subject line first on its own line starting with 'Subject: ', then a blank line, then the body). 150-200 words. Personal, founder-led, explains Elbold, invites them to learn more. End with a clear but low-pressure call to action.",
  "instagram_dm": "Short Instagram DM under 80 words. Casual but professional. Mention their work. Invite them to email or visit Elbold. No links in first DM — just a warm introduction.",
  "facebook_message": "Short Facebook message under 100 words. Slightly warmer than Instagram DM. Mention their business by name. Invite them to find out more.",
  "follow_up_email": "Follow-up email for a lead that did not respond to first contact. 80-120 words. Gentle, not pushy. Acknowledge they may be busy. Short and respectful of their time.",
  "phone_script": "Phone call script with natural spoken language. Include: greeting, brief Elbold introduction (10 seconds), the proposition, handling 'what is Elbold?', and a close that asks for their email to send more details. Keep it under 150 words."
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from AI");
  return JSON.parse(content) as OutreachMessages;
}
