import type { Vendor } from "@/types";

type VendorSubset = Pick<Vendor,
  | "bio" | "phone" | "city" | "min_price"
  | "instagram_url" | "website_url" | "status" | "verification_level"
>;

export interface OnboardingItem {
  label: string;
  done: boolean;
  points: number;
  tip: string;
}

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  maxPoints: number;
  earnedPoints: number;
  complete: boolean;
  href: string;
  cta: string;
  items: OnboardingItem[];
}

export interface CompletionResult {
  score: number;
  steps: OnboardingStep[];
  nextStep: OnboardingStep | null;
  isMarketplaceReady: boolean;
  strengthLabel: "Getting Started" | "Building Profile" | "Almost Ready" | "Marketplace Ready" | "Fully Optimised";
  nextActionText: string | null;
  nextActionHref: string | null;
}

interface CompletionInput {
  vendor: VendorSubset;
  mediaCount: number;
  packageCount: number;
  hasAvailability: boolean;
}

export function computeVendorCompletion({
  vendor,
  mediaCount,
  packageCount,
  hasAvailability,
}: CompletionInput): CompletionResult {
  const verificationLevel = vendor.verification_level ?? 0;
  const bioLength = (vendor.bio ?? "").trim().length;
  const hasSocial = !!(vendor.instagram_url || vendor.website_url);
  const isApproved = vendor.status === "approved";

  const rawSteps: Omit<OnboardingStep, "earnedPoints" | "complete">[] = [
    {
      id: "profile",
      label: "Basic Profile",
      description: "Tell customers who you are and what makes you special",
      maxPoints: 22,
      href: "/vendor/profile",
      cta: "Edit Profile",
      items: [
        { label: "Write your bio (50+ characters)", done: bioLength >= 50, points: 10, tip: "A detailed bio helps customers choose you over competitors" },
        { label: "Add a contact phone number", done: !!vendor.phone, points: 6, tip: "Required for booking confirmation and customer contact" },
        { label: "Set your city and service area", done: !!vendor.city, points: 6, tip: "Customers search by location — essential for discovery" },
      ],
    },
    {
      id: "services",
      label: "Services & Packages",
      description: "Define what you offer and your pricing structure",
      maxPoints: 18,
      href: "/vendor/services",
      cta: "Add Services",
      items: [
        { label: "Create at least one service package", done: packageCount >= 1, points: 12, tip: "Packages give customers instant pricing clarity" },
        { label: "Set your starting price", done: !!vendor.min_price, points: 6, tip: "Customers filter by budget — pricing is essential for visibility" },
      ],
    },
    {
      id: "media",
      label: "Photo Gallery",
      description: "Show your best work — photos are the #1 conversion factor",
      maxPoints: 15,
      href: "/vendor/media",
      cta: "Upload Photos",
      items: [
        { label: "Upload at least one photo", done: mediaCount >= 1, points: 5, tip: "Profiles with photos receive 5x more enquiries" },
        { label: "Upload 5 or more photos", done: mediaCount >= 5, points: 10, tip: "Vendors with 5+ photos receive 3x more quote requests" },
      ],
    },
    {
      id: "verification",
      label: "Verification Documents",
      description: "Document-verified vendors build stronger customer trust and rank higher",
      maxPoints: 25,
      href: "/vendor/verification",
      cta: "Start Verification",
      items: [
        { label: "Email + phone confirmed (level 1)", done: verificationLevel >= 1, points: 5, tip: "Your account is registered — submit documents to unlock verified badges" },
        { label: "Government ID approved (level 2)", done: verificationLevel >= 2, points: 10, tip: "Submit a government-issued ID for ID Verified status" },
        { label: "Proof of address approved (level 3+)", done: verificationLevel >= 3, points: 10, tip: "Submit proof of address or business registration for full Business Verified status" },
      ],
    },
    {
      id: "trust",
      label: "Trust & Availability",
      description: "Help customers plan around your schedule and learn more about you",
      maxPoints: 10,
      href: "/vendor/availability",
      cta: "Set Availability",
      items: [
        { label: "Add website or social media link", done: hasSocial, points: 4, tip: "Social presence increases customer confidence by 40%" },
        { label: "Configure your availability calendar", done: hasAvailability, points: 6, tip: "Customers check availability before they enquire — be bookable" },
      ],
    },
    {
      id: "ready",
      label: "Marketplace Ready",
      description: "Your profile is live and visible to customers across the UK",
      maxPoints: 10,
      href: "/vendor/dashboard",
      cta: "View Dashboard",
      items: [
        { label: "Profile approved and live on marketplace", done: isApproved, points: 10, tip: "Submit your profile for admin review to go live" },
      ],
    },
  ];

  const steps: OnboardingStep[] = rawSteps.map((step) => {
    const earnedPoints = step.items.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);
    const complete = step.items.every((item) => item.done);
    return { ...step, earnedPoints, complete };
  });

  const score = Math.min(100, steps.reduce((sum, s) => sum + s.earnedPoints, 0));
  const nextStep = steps.find((s) => !s.complete) ?? null;
  // Marketplace ready requires both profile score AND at least basic verification (level 1)
  const isMarketplaceReady = score >= 60 && verificationLevel >= 1;

  let strengthLabel: CompletionResult["strengthLabel"];
  if (score < 25) strengthLabel = "Getting Started";
  else if (score < 50) strengthLabel = "Building Profile";
  else if (score < 75) strengthLabel = "Almost Ready";
  // Cannot reach "Fully Optimised" without document verification (level 2+)
  else if (score < 95 || verificationLevel < 2) strengthLabel = "Marketplace Ready";
  else strengthLabel = "Fully Optimised";

  let nextActionText: string | null = null;
  let nextActionHref: string | null = null;
  if (nextStep) {
    const firstMissing = nextStep.items.find((i) => !i.done);
    nextActionText = firstMissing?.tip ?? nextStep.cta;
    nextActionHref = nextStep.href;
  }

  return { score, steps, nextStep, isMarketplaceReady, strengthLabel, nextActionText, nextActionHref };
}

// ── Customer-facing verification trust score ──────────────────────────────────
// Separate from the vendor's internal profile completion score.
// This is what customers see on vendor profiles and marketplace cards.
export interface VerificationTrustResult {
  level: number;           // 0–4 from DB; 5 computed dynamically
  trustScore: number;      // 0–100 shown to customers
  label: string;           // Human-readable label
  badgeId: string | null;  // Badge identifier, null if unverified
  isVerified: boolean;     // True if level >= 2 (document verified)
}

export function computeVerificationTrustScore(vendor: {
  verification_level?: number;
  completed_jobs_count?: number;
  rating?: number;
  response_rate?: number | null;
}): VerificationTrustResult {
  const level = vendor.verification_level ?? 0;
  const jobs  = vendor.completed_jobs_count ?? 0;
  const rating = vendor.rating ?? 0;
  const responseRate = vendor.response_rate ?? 0;

  // Level 5 = Trusted Professional, computed dynamically from track record
  const isTrustedPro = level >= 2 && jobs >= 5 && rating >= 4.5 && responseRate >= 80;

  if (level <= 0) return { level: 0, trustScore: 0,  label: "Unverified",            badgeId: null,               isVerified: false };
  if (level === 1) return { level: 1, trustScore: 10, label: "Email Verified",        badgeId: "email_verified",   isVerified: false };
  if (level === 2 && !isTrustedPro) return { level: 2, trustScore: 40, label: "ID Verified",     badgeId: "id_verified",      isVerified: true  };
  if (level === 3 && !isTrustedPro) return { level: 3, trustScore: 70, label: "Address Verified", badgeId: "address_verified", isVerified: true  };
  if (level >= 4 && !isTrustedPro) return { level: 4, trustScore: 85, label: "Business Verified", badgeId: "business_verified", isVerified: true };
  if (isTrustedPro && level < 4) return { level: 5, trustScore: 90, label: "Trusted Professional", badgeId: "trusted_pro", isVerified: true };
  return { level: 5, trustScore: 100, label: "Trusted Professional", badgeId: "trusted_pro", isVerified: true };
}

export interface ActivationMessage {
  message: string;
  href: string;
}

export function getActivationMessages(completion: CompletionResult): ActivationMessage[] {
  const msgs: ActivationMessage[] = [];
  const { steps, score } = completion;

  const mediaStep = steps.find((s) => s.id === "media");
  const mediaCount = mediaStep?.items[1]?.done ? 5 : (mediaStep?.items[0]?.done ? 1 : 0);
  if (mediaCount === 0) msgs.push({ message: "Upload photos to increase your enquiry rate by 5x", href: "/vendor/media" });
  else if (mediaCount < 5) msgs.push({ message: `Upload ${5 - mediaCount} more photos to unlock full visibility`, href: "/vendor/media" });

  const verStep = steps.find((s) => s.id === "verification");
  if (verStep && !verStep.items[1].done) msgs.push({ message: "Submit a government ID to get 'ID Verified' — customers trust verified vendors more", href: "/vendor/verification" });
  else if (verStep && !verStep.items[2].done) msgs.push({ message: "Submit proof of address or business registration for 'Business Verified' status", href: "/vendor/verification" });

  const svcStep = steps.find((s) => s.id === "services");
  if (svcStep && !svcStep.items[0].done) msgs.push({ message: "Create a service package so customers can request quotes", href: "/vendor/services" });
  else if (svcStep && !svcStep.items[1].done) msgs.push({ message: "Add your starting price to appear in budget searches", href: "/vendor/services" });

  const profileStep = steps.find((s) => s.id === "profile");
  if (profileStep && !profileStep.items[0].done) msgs.push({ message: "Write a bio of 50+ characters to improve your search ranking", href: "/vendor/profile" });

  const trustStep = steps.find((s) => s.id === "trust");
  if (trustStep && !trustStep.items[1].done) msgs.push({ message: "Set your availability so customers can see when you're bookable", href: "/vendor/availability" });

  if (score >= 90) msgs.push({ message: "Profile fully optimised — you rank at the top of marketplace search", href: "/vendor/dashboard" });

  return msgs.slice(0, 3);
}
