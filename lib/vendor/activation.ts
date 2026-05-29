export type ActivationPhase =
  | "no_account"
  | "pending"
  | "rejected"
  | "suspended"
  | "setup"
  | "marketplace_ready"
  | "optimised";

export interface ActivationStatus {
  phase: ActivationPhase;
  isVisible: boolean;
  isBookable: boolean;
  blockers: string[];
  completionScore: number;
}

interface ActivationInput {
  status: string;
  completionScore: number;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  min_price?: number | null;
}

export function getActivationStatus(vendor: ActivationInput | null): ActivationStatus {
  if (!vendor) {
    return {
      phase: "no_account",
      isVisible: false,
      isBookable: false,
      blockers: ["No vendor account"],
      completionScore: 0,
    };
  }

  const { status, completionScore: score } = vendor;

  if (status === "pending") {
    return {
      phase: "pending",
      isVisible: false,
      isBookable: false,
      blockers: ["Application pending admin approval"],
      completionScore: score,
    };
  }

  if (status === "rejected") {
    return {
      phase: "rejected",
      isVisible: false,
      isBookable: false,
      blockers: ["Application rejected — contact support to reapply"],
      completionScore: score,
    };
  }

  if (status === "suspended") {
    return {
      phase: "suspended",
      isVisible: false,
      isBookable: false,
      blockers: ["Account suspended — contact support"],
      completionScore: score,
    };
  }

  // Approved — assess profile completeness for bookability
  const blockers: string[] = [];
  if (!vendor.bio || vendor.bio.trim().length < 50) blockers.push("Bio too short (50+ characters required)");
  if (!vendor.phone) blockers.push("Phone number missing");
  if (!vendor.city) blockers.push("City / service area not set");
  if (!vendor.min_price) blockers.push("Starting price not set");

  if (score < 60) {
    return { phase: "setup", isVisible: true, isBookable: false, blockers, completionScore: score };
  }

  return {
    phase: score >= 90 ? "optimised" : "marketplace_ready",
    isVisible: true,
    isBookable: true,
    blockers,
    completionScore: score,
  };
}
