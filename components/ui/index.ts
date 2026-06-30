// ELBOLD UI Component Library — barrel exports
// Use these paths in new code. Existing deep-path imports remain valid during migration.

// ── P0 Components (ESP 1.1) ───────────────────────────────────────────────────
export { FilterTabs } from "./FilterTabs";
export type { FilterTab } from "./FilterTabs";
export { NotificationIndicator } from "./NotificationIndicator";
export { StatusPage } from "./StatusPage";
export { StatGrid } from "./StatGrid";
export type { StatItem } from "./StatGrid";

// ── State & Feedback ──────────────────────────────────────────────────────────
export { LoadingState, EmptyState, ErrorState } from "./StateComponents";
export { LoadingSpinner, PageLoader } from "./LoadingSpinner";
export {
  SkeletonCard,
  SkeletonVendorCard,
  SkeletonRow,
  SkeletonText,
  SkeletonStats,
} from "./SkeletonLoader";
export { ErrorBoundary } from "./ErrorBoundary";

// ── Data Display ──────────────────────────────────────────────────────────────
export { Badge, StatusBadge } from "./Badge";
export { StarRating } from "./StarRating";
export { MediaGallery } from "./MediaGallery";
export type { ShowcaseItem } from "./ShowcaseGrid";
export { ShowcaseGrid } from "./ShowcaseGrid";

// ── Trust & Social Proof ──────────────────────────────────────────────────────
export {
  TrustBadges,
  VendorTrustBadge,
  PlatformGuaranteeBanner,
  MarketplaceStatsBar,
  BookingProtectionCard,
  ResponseTimePill,
  CompletedJobsPill,
  VendorPaymentTrust,
  RefundPolicyCard,
} from "./TrustBadges";
export { BookingPromise } from "./BookingPromise";

// ── Content & Discovery ───────────────────────────────────────────────────────
export { TrendingVendors, ActivityFeedItem, LiveActivityWidget } from "./TrendingVendors";
export { VendorSocialFeed } from "./social/VendorSocialFeed";
export type { SocialPost } from "./social/VendorSocialFeed";

// ── Utilities ─────────────────────────────────────────────────────────────────
export { CopyButton } from "./CopyButton";
export { LegalPage } from "./LegalPage";
