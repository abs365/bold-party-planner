import type { VendorCategory } from "@/types";

export type DocumentType =
  | "government_id"
  | "insurance"
  | "business_registration"
  | "food_hygiene"
  | "sia_license"
  | "operator_license"
  | "proof_of_address"
  | "bank_verification"
  | "portfolio_authenticity";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  government_id:           "Government ID",
  insurance:               "Public Liability Insurance",
  business_registration:   "Business Registration",
  food_hygiene:            "Food Hygiene Certificate",
  sia_license:             "SIA Licence",
  operator_license:        "Operator Licence",
  proof_of_address:        "Proof of Address",
  bank_verification:       "Bank Verification",
  portfolio_authenticity:  "Portfolio Authenticity Declaration",
};

export const DOCUMENT_DESCRIPTIONS: Record<DocumentType, string> = {
  government_id:           "Passport, driving licence or national ID card",
  insurance:               "Public liability insurance certificate (minimum £1M cover)",
  business_registration:   "Companies House registration or sole trader proof",
  food_hygiene:            "Level 2 Food Hygiene Certificate (must be current)",
  sia_license:             "Valid Security Industry Authority licence",
  operator_license:        "Vehicle operator licence for passenger transport",
  proof_of_address:        "Utility bill or bank statement (issued within last 3 months)",
  bank_verification:       "Bank statement or voided cheque showing account details",
  portfolio_authenticity:  "Declaration that all portfolio images are your own original work",
};

// Category-specific required documents for Level 2 (Business Verified)
export const CATEGORY_REQUIREMENTS: Partial<Record<VendorCategory, DocumentType[]>> = {
  dj:                ["government_id", "proof_of_address"],
  decorator:         ["government_id", "proof_of_address"],
  caterer:           ["government_id", "food_hygiene", "insurance", "proof_of_address"],
  photographer:      ["government_id", "proof_of_address", "portfolio_authenticity"],
  videographer:      ["government_id", "proof_of_address", "portfolio_authenticity"],
  mc:                ["government_id", "proof_of_address"],
  security:          ["government_id", "sia_license", "insurance"],
  usher:             ["government_id"],
  makeup_artist:     ["government_id", "proof_of_address"],
  cake_maker:        ["government_id", "food_hygiene", "proof_of_address"],
  balloon_decorator: ["government_id", "proof_of_address"],
  lighting_stage:    ["government_id", "insurance", "proof_of_address"],
  furniture_rental:  ["government_id", "insurance", "proof_of_address"],
  marquee_rental:    ["government_id", "insurance", "proof_of_address"],
  live_band:         ["government_id", "proof_of_address"],
  luxury_services:   ["government_id", "insurance", "business_registration"],
  transport:         ["government_id", "operator_license", "insurance"],
  cleaner:           ["government_id", "insurance"],
  event_staff:       ["government_id"],
  other:             ["government_id"],
};

export function getRequirementsForCategory(category: VendorCategory | string): DocumentType[] {
  return CATEGORY_REQUIREMENTS[category as VendorCategory] ?? ["government_id"];
}

// Verification level display config
export const VERIFICATION_LEVELS = [
  {
    level: 0,
    label: "Unverified",
    color: "text-slate-400",
    bg: "bg-slate-500/15",
    border: "border-slate-500/20",
    icon: "○",
  },
  {
    level: 1,
    label: "Verified",
    color: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/25",
    icon: "✓",
    description: "Email, phone and profile complete",
  },
  {
    level: 2,
    label: "Business Verified",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/25",
    icon: "✓✓",
    description: "Identity and business documents reviewed",
  },
  {
    level: 3,
    label: "Trusted Pro",
    color: "text-brand-400",
    bg: "bg-brand-500/15",
    border: "border-brand-500/25",
    icon: "★",
    description: "Proven track record of excellent service",
  },
  {
    level: 4,
    label: "Premium Partner",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/25",
    icon: "★★",
    description: "Invite-only elite vendor status",
  },
] as const;
