export const TARGET_CATEGORIES = [
  "dj", "decorator", "photographer", "videographer", "caterer",
  "event_planner", "cake_maker", "balloon_decorator", "venue_hire",
  "live_band", "mc",
] as const;

export const TARGET_REGIONS = ["London", "Kent", "Essex"] as const;

export interface LeadScoringInput {
  region: string | null;
  category: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
}

export interface ScoreBreakdown {
  location_match: number;
  category_match: number;
  website: number;
  social: number;
  email: number;
  phone: number;
  rating: number;
  review_count: number;
  total: number;
  priority: "high" | "medium" | "low";
}

export function scoreLead(input: LeadScoringInput): ScoreBreakdown {
  const location_match = TARGET_REGIONS.includes(input.region as typeof TARGET_REGIONS[number]) ? 20 : 0;
  const category_match = TARGET_CATEGORIES.includes(input.category as typeof TARGET_CATEGORIES[number]) ? 20 : 0;
  const website        = input.website  ? 10 : 0;
  const social         = (input.instagram || input.facebook) ? 10 : 0;
  const email          = input.email    ? 15 : 0;
  const phone          = input.phone    ? 10 : 0;
  const rating         = (input.rating ?? 0) >= 4.0 ? 10 : 0;
  const review_count   = (input.review_count ?? 0) >= 20 ? 5 : 0;

  const total = location_match + category_match + website + social + email + phone + rating + review_count;

  const priority: "high" | "medium" | "low" =
    total >= 75 ? "high" :
    total >= 45 ? "medium" : "low";

  return { location_match, category_match, website, social, email, phone, rating, review_count, total, priority };
}
