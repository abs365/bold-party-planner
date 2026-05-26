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
  event_types: string[] | null;
  subscription_plan: "free" | "pro" | "featured";
  profile_views: number;
  service_areas: string[] | null;
  verification_level: number;
  response_rate: number | null;
  completed_jobs_count: number;
  cancellation_rate: number | null;
  suspicious_flag: boolean;
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

export interface VendorPackage {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
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

export interface Review {
  id: string;
  booking_id: string;
  vendor_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  created_at: string;
  profile?: Profile;
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
  decorator: { label: "Decorator", icon: "🎨", description: "Event decoration & styling" },
  caterer: { label: "Caterer", icon: "🍽️", description: "Food & beverages" },
  photographer: { label: "Photographer", icon: "📸", description: "Photo coverage" },
  videographer: { label: "Videographer", icon: "🎥", description: "Video coverage & editing" },
  mc: { label: "MC / Host", icon: "🎤", description: "Master of ceremonies" },
  security: { label: "Security", icon: "🛡️", description: "Event security personnel" },
  usher: { label: "Ushers", icon: "🤝", description: "Guest management & ushering" },
  makeup_artist: { label: "Makeup Artist", icon: "💄", description: "Makeup & beauty" },
  cake_maker: { label: "Cake Maker", icon: "🎂", description: "Custom cakes & desserts" },
  balloon_decorator: { label: "Balloon Decorator", icon: "🎈", description: "Balloon art & decoration" },
  lighting_stage: { label: "Lighting & Stage", icon: "💡", description: "Lighting rigs & stage setup" },
  furniture_rental: { label: "Furniture Rental", icon: "🪑", description: "Tables, chairs & furniture" },
  marquee_rental: { label: "Marquee Rental", icon: "⛺", description: "Tents & marquee hire" },
  live_band: { label: "Live Band", icon: "🎸", description: "Live music performance" },
  luxury_services: { label: "Luxury Services", icon: "✨", description: "Premium event experiences" },
  transport: { label: "Transport", icon: "🚗", description: "Guest & VIP transport" },
  cleaner: { label: "Cleaners", icon: "🧹", description: "Pre & post event cleaning" },
  event_staff: { label: "Event Staff", icon: "👔", description: "Waiters, runners & helpers" },
  other: { label: "Other Services", icon: "✨", description: "Specialist & unique event services" },
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
