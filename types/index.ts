export type UserRole = "customer" | "vendor" | "admin";

export type EventType =
  | "birthday"
  | "wedding"
  | "corporate"
  | "baby_shower"
  | "anniversary"
  | "graduation"
  | "naming_ceremony"
  | "funeral"
  | "charity"
  | "conference"
  | "engagement"
  | "gender_reveal"
  | "other";

export type VendorCategory =
  | "dj"
  | "decorator"
  | "caterer"
  | "photographer"
  | "videographer"
  | "mc"
  | "security"
  | "usher"
  | "makeup_artist"
  | "cake_maker"
  | "balloon_decorator"
  | "lighting_stage"
  | "furniture_rental"
  | "marquee_rental"
  | "live_band"
  | "luxury_services"
  | "transport"
  | "cleaner"
  | "event_staff"
  | "event_planner"
  | "other";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "disputed";

export type PaymentStatus =
  | "pending"
  | "deposit_paid"
  | "fully_paid"
  | "refunded"
  | "partially_refunded"
  | "failed";

export type VendorStatus = "pending" | "approved" | "rejected" | "suspended";

export type VendorLifecycleState =
  | "no_account"
  | "pending"
  | "setup"
  | "at_risk"
  | "marketplace_ready"
  | "optimised"
  | "suspended"
  | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  tagline: string | null;
  category: VendorCategory;
  bio: string | null;
  description: string | null;
  location: string;
  city: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  travel_radius_km: number;
  status: VendorStatus;
  rating: number;
  review_count: number;
  total_reviews: number;
  min_price: number | null;
  max_price: number | null;
  starting_price: number;
  verified: boolean;
  featured: boolean;
  years_experience: number | null;
  instagram_url: string | null;
  website_url: string | null;
  custom_category_description?: string | null;
  event_types: string[] | null;
  subscription_plan: "free" | "pro" | "featured" | "premium" | "elite";
  profile_views: number;
  service_areas: string[] | null;
  verification_level: number;
  response_rate: number | null;
  completed_jobs_count: number;
  cancellation_rate: number | null;
  suspicious_flag: boolean;
  suspicious_reason: string | null;
  last_active_at: string | null;
  trust_tier: "new" | "trusted" | "top_rated" | "exceptional";
  verified_review_count: number;
  reputation_score: number;
  repeat_customer_count: number;
  dispute_count: number;
  created_at: string;
  updated_at: string | null;
  profile?: Profile;
  media?: VendorMedia[];
  packages?: VendorPackage[];
}

export interface VendorMedia {
  id: string;
  vendor_id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  is_cover: boolean;
  is_featured?: boolean;
  sort_order: number;
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
  duration_secs?: number | null;
  tags?: string[];
  created_at: string;
}

export type PricingType = "fixed" | "starting_from" | "per_person" | "price_on_request";

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  fixed:             "Fixed Price",
  starting_from:     "Starting From",
  per_person:        "Per Person",
  price_on_request:  "Price on Request",
};

export interface VendorPackage {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  pricing_type: PricingType;
  duration_hours: number | null;
  includes: string[];
  is_popular: boolean;
  created_at: string;
}

export interface VendorAvailability {
  id: string;
  vendor_id: string;
  date: string;
  is_available: boolean;
  notes: string | null;
}

export interface Event {
  id: string;
  customer_id: string;
  title: string;
  event_type: EventType;
  date: string;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string;
  guest_count: number;
  budget: number;
  theme: string | null;
  notes: string | null;
  status: "draft" | "planning" | "confirmed" | "completed" | "cancelled";
  ai_plan: AIEventPlan | null;
  created_at: string;
  profile?: Profile;
  bookings?: Booking[];
}

export interface AIEventPlan {
  summary: string;
  vendors_needed: { category: VendorCategory; priority: "essential" | "recommended" | "optional"; reason: string }[];
  budget_breakdown: { category: string; amount: number; percentage: number }[];
  timeline: { time: string; task: string }[];
  checklist: { category: string; items: string[] }[];
  tips: string[];
  risks: string[];
}

export interface Booking {
  id: string;
  event_id: string;
  vendor_id: string;
  package_id: string | null;
  customer_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  deposit_amount: number;
  commission_amount: number;
  vendor_payout: number;
  notes: string | null;
  customer_notes: string | null;
  confirmed_at: string | null;
  created_at: string;
  vendor?: Vendor | Record<string, unknown>;
  event?: Event | Record<string, unknown>;
  customer?: Profile | Record<string, unknown>;
  package?: VendorPackage;
  payment?: Payment;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  type: "deposit" | "full" | "refund";
  status: "pending" | "succeeded" | "failed" | "cancelled";
  created_at: string;
}

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  customer_id: string;
  vendor_id: string;
  line_items: { description: string; amount: number }[];
  subtotal: number;
  commission: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export type ReviewModerationStatus = "approved" | "flagged" | "removed";

export interface Review {
  id: string;
  booking_id: string;
  vendor_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  response_at: string | null;
  // sub-ratings (optional — not all reviews will have them)
  communication_rating:   number | null;
  professionalism_rating: number | null;
  punctuality_rating:     number | null;
  quality_rating:         number | null;
  value_rating:           number | null;
  // moderation
  moderation_status: ReviewModerationStatus;
  moderation_notes:  string | null;
  moderated_by:      string | null;
  moderated_at:      string | null;
  // verification
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  profile?: Profile;
}

export type ReviewReportReason = "fake" | "spam" | "offensive" | "irrelevant" | "conflict_of_interest" | "other";

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: ReviewReportReason;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface VendorSubscription {
  id: string;
  vendor_id: string;
  plan: "free" | "pro" | "featured" | "premium" | "elite";
  status: "active" | "cancelled" | "past_due" | "trialing";
  billing_cycle: "monthly" | "annual";
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  failed_payment_count: number;
  last_payment_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  visibility_boost: number;
  max_images: number;
  max_packages: number;
  analytics_tier: "basic" | "standard" | "advanced";
  featured_eligible: boolean;
  category_featured_eligible: boolean;
  priority_support: boolean;
  active: boolean;
  features_json: Record<string, unknown>;
  sort_order: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "review" | "reminder" | "system";
  read: boolean;
  link: string | null;
  created_at: string;
}

export const VENDOR_CATEGORIES: Record<VendorCategory, { label: string; icon: string; description: string }> = {
  dj: { label: "DJ", icon: "🎧", description: "Music & entertainment" },
  decorator: { label: "Decorator", icon: "🌸", description: "Event decoration & styling" },
  caterer: { label: "Caterer", icon: "🍽️", description: "Food & beverages" },
  photographer: { label: "Photographer", icon: "📸", description: "Photo coverage" },
  videographer: { label: "Videographer", icon: "🎥", description: "Video coverage & editing" },
  mc: { label: "MC / Host", icon: "🎤", description: "Master of ceremonies" },
  security: { label: "Security", icon: "🛡️", description: "Event security personnel" },
  usher: { label: "Ushers", icon: "🎟️", description: "Guest management & ushering" },
  makeup_artist: { label: "Makeup Artist", icon: "💄", description: "Makeup & beauty" },
  cake_maker: { label: "Cake Maker", icon: "🎂", description: "Custom cakes & desserts" },
  balloon_decorator: { label: "Balloon Decorator", icon: "🎈", description: "Balloon art & decoration" },
  lighting_stage: { label: "Lighting & Stage", icon: "🎭", description: "Lighting rigs & stage setup" },
  furniture_rental: { label: "Furniture Rental", icon: "🪑", description: "Tables, chairs & furniture" },
  marquee_rental: { label: "Marquee Rental", icon: "🏛️", description: "Tents & marquee hire" },
  live_band: { label: "Live Band", icon: "🎸", description: "Live music performance" },
  luxury_services: { label: "Luxury Services", icon: "🥂", description: "Premium event experiences" },
  transport: { label: "Transport", icon: "🚐", description: "Guest & VIP transport" },
  cleaner: { label: "Cleaners", icon: "🧹", description: "Pre & post event cleaning" },
  event_staff: { label: "Event Staff", icon: "👔", description: "Waiters, runners & helpers" },
  event_planner: { label: "Event Planner", icon: "📋", description: "Full event planning & coordination" },
  other: { label: "Other Services", icon: "⚙️", description: "Specialist & unique event services" },
};

export const EVENT_TYPES: Record<EventType, { label: string; icon: string }> = {
  birthday: { label: "Birthday", icon: "🎂" },
  wedding: { label: "Wedding", icon: "💍" },
  corporate: { label: "Corporate", icon: "💼" },
  baby_shower: { label: "Baby Shower", icon: "👶" },
  anniversary: { label: "Anniversary", icon: "💕" },
  graduation: { label: "Graduation", icon: "🎓" },
  naming_ceremony: { label: "Naming Ceremony", icon: "🌟" },
  funeral: { label: "Funeral", icon: "🌹" },
  charity: { label: "Charity Event", icon: "❤️" },
  conference: { label: "Conference", icon: "📋" },
  engagement: { label: "Engagement", icon: "💎" },
  gender_reveal: { label: "Gender Reveal", icon: "🎉" },
  other: { label: "Other", icon: "✨" },
};

export const COMMISSION_RATE = 0.1; // 10% platform commission

// ── Guest Management ──────────────────────────────────────────────────────────

export type RSVPStatus = "pending" | "accepted" | "declined" | "tentative";

export interface Guest {
  id: string;
  event_id: string;
  customer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: RSVPStatus;
  is_vip: boolean;
  plus_one_allowed: boolean;
  plus_one_name: string | null;
  meal_preference: string | null;
  dietary_notes: string | null;
  tags: string[];
  notes: string | null;
  invited_at: string | null;
  responded_at: string | null;
  created_at: string;
}

export type InvitationTemplate = "classic" | "elegant" | "playful" | "minimal" | "luxury";

export interface Invitation {
  id: string;
  event_id: string;
  customer_id: string;
  template: InvitationTemplate;
  title: string | null;
  message: string | null;
  dress_code: string | null;
  rsvp_deadline: string | null;
  cover_image_url: string | null;
  rsvp_token: string;
  is_active: boolean;
  view_count: number;
  rsvp_count: number;
  created_at: string;
  updated_at: string | null;
  event?: Event;
}

export interface RSVPResponse {
  id: string;
  invitation_id: string;
  guest_id: string | null;
  guest_name: string;
  email: string | null;
  status: "accepted" | "declined" | "tentative";
  plus_one: boolean;
  meal_preference: string | null;
  message: string | null;
  created_at: string;
}

// ── Quote workflow ────────────────────────────────────────────────────────────

export type QuoteStatus =
  | "pending"     // customer request sent, vendor hasn't responded
  | "responded"   // vendor has submitted a price
  | "viewed"      // customer opened vendor's quote
  | "shortlisted" // customer marked as favourite for comparison
  | "accepted"    // customer accepted this vendor's quote
  | "rejected"    // customer rejected this vendor's quote
  | "expired"     // passed expires_at with no customer action
  | "withdrawn"   // customer withdrew the request
  | "converted"   // booking created
  | "declined";   // vendor declined to quote (legacy / vendor-initiated)

export type QuoteResponseStatus = "pending" | "accepted" | "declined";

export interface QuoteResponse {
  id: string;
  quote_id: string;
  vendor_id: string;
  price: number;
  deposit_amount: number | null;
  message: string | null;
  title: string | null;
  description: string | null;
  services: string[] | null;
  terms: string | null;
  duration_hours: number | null;
  includes: string[] | null;
  valid_until: string | null;
  status: QuoteResponseStatus;
  withdrawal_reason: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Quote {
  id: string;
  customer_id: string;
  vendor_id: string;
  event_id: string | null;
  status: QuoteStatus;
  message: string | null;
  requirements: string | null;
  notes: string | null;
  city: string | null;
  category: string | null;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  budget_min: number | null;
  budget_max: number | null;
  expires_at: string | null;
  lead_score: number | null;
  routed_at: string | null;
  responded_at: string | null;
  accepted_at: string | null;
  viewed_at: string | null;
  shortlisted_at: string | null;
  rejected_at: string | null;
  withdrawn_at: string | null;
  vendor_decline_reason: string | null;
  customer_rejection_reason: string | null;
  converted_booking_id: string | null;
  created_at: string;
  // Joined relations (optional, present when selected)
  vendor?: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    rating: number | null;
    review_count?: number | null;
    bio?: string | null;
    verification_level?: number | null;
    response_rate?: number | null;
    completed_jobs_count?: number | null;
    media?: Array<{ url: string; is_cover: boolean; type?: string }>;
    packages?: Array<{ id: string; name: string; price: number; includes: string[] | null }>;
  };
  customer?: { id: string; full_name: string; avatar_url: string | null };
  event?: { id: string; title: string; date: string; city?: string | null; guest_count?: number | null };
  response?: QuoteResponse | QuoteResponse[] | null;
}

export interface QuoteEvent {
  id: string;
  quote_id: string;
  actor_id: string | null;
  actor_role: "customer" | "vendor" | "admin" | "system";
  event_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface EventGuestStats {
  event_id: string;
  total_guests: number;
  accepted: number;
  declined: number;
  tentative: number;
  pending: number;
  vip_count: number;
  plus_ones_confirmed: number;
}
