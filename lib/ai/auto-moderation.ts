// AI Automation Layer — Phase 1 (Rule-Based)
// Replace individual functions with ML models as data grows

// TODO: Replace this keyword blocklist with the OpenAI Moderation API in production.
// POST https://api.openai.com/v1/moderations — free endpoint, returns category scores.

export const BLOCKED_KEYWORDS: string[] = [
  "spam",
  "scam",
  "free money",
  "click here",
  "make money fast",
  "winner",
  "congratulations you",
  "nigerian prince",
  "wire transfer",
  "adult content",
  "xxx",
  "casino",
  "gambling",
  "drugs",
  "illegal",
  "hack",
  "phishing",
  "malware",
];

export interface ModerationResult {
  approved: boolean;
  reason?: string;
}

/**
 * Basic keyword blocklist moderation.
 * Returns { approved: true } unless the text contains a blocked keyword.
 *
 * NOTE: This is a placeholder. Replace with OpenAI Moderation API before production.
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  if (!text || typeof text !== "string") {
    return { approved: true };
  }

  const normalised = text.toLowerCase();

  for (const keyword of BLOCKED_KEYWORDS) {
    if (normalised.includes(keyword.toLowerCase())) {
      return {
        approved: false,
        reason: `Content flagged: contains blocked term "${keyword}"`,
      };
    }
  }

  return { approved: true };
}
