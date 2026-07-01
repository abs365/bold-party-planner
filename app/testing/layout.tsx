import type { Metadata } from "next";

// Internal pilot-testing forms — not part of the public marketplace experience.
// Kept reachable for active pilot testers but excluded from search discovery.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TestingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
