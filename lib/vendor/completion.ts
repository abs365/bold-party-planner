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
      label: "Identity Verification",
      description: "Verified vendors get priority placement and higher customer trust",
      maxPoints: 25,
      href: "/vendor/verification",
      cta: "Start Verification",
      items: [
        { label: "Profile auto-verified (level 1)", done: verificationLevel >= 1, points: 8, tip: "Complete profile + phone + 3 photos to auto-verify" },
        { label: "Document verification approved (level 2)", done: verificationLevel >= 2, points: 17, tip: "Submit ID and business documents for full Business Verified status" },
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
  const isMarketplaceReady = score >= 60;

  let strengthLabel: CompletionResult["strengthLabel"];
  if (score < 25) strengthLabel = "Getting Started";
  else if (score < 50) strengthLabel = "Building Profile";
  else if (score < 75) strengthLabel = "Almost Ready";
  else if (score < 95) strengthLabel = "Marketplace Ready";
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

export function getActivationMessages(completion: CompletionResult): string[] {
  const messages: string[] = [];
  const { steps, score } = completion;

  const mediaStep = steps.find((s) => s.id === "media");
  const mediaCount = mediaStep?.items[1]?.done ? 5 : (mediaStep?.items[0]?.done ? 1 : 0);
  if (mediaCount === 0) messages.push("Upload photos to increase your enquiry rate by 5x");
  else if (mediaCount < 5) messages.push(`Upload ${5 - mediaCount} more photos to unlock full visibility`);

  const verStep = steps.find((s) => s.id === "verification");
  if (verStep && !verStep.items[0].done) messages.push("Complete your profile to unlock automatic Level 1 verification");
  else if (verStep && !verStep.items[1].done) messages.push("Submit verification documents to get 'Business Verified' badge");

  const svcStep = steps.find((s) => s.id === "services");
  if (svcStep && !svcStep.items[0].done) messages.push("Create a service package so customers can request quotes");
  else if (svcStep && !svcStep.items[1].done) messages.push("Add your starting price to appear in budget searches");

  const profileStep = steps.find((s) => s.id === "profile");
  if (profileStep && !profileStep.items[0].done) messages.push("Write a bio of 50+ characters to improve your search ranking");

  const trustStep = steps.find((s) => s.id === "trust");
  if (trustStep && !trustStep.items[1].done) messages.push("Set your availability so customers can see when you're bookable");

  if (score >= 90) messages.push("Profile fully optimised — you rank at the top of marketplace search");

  return messages.slice(0, 3);
}
