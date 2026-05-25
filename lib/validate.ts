import { z } from "zod";

// ── Shared field validators ──────────────────────────────────────────────────

export const emailSchema = z.string().email("Invalid email address").max(254);
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);
export const phoneSchema = z.string().regex(/^(\+44|0)[0-9]{9,10}$/, "Invalid UK phone number").optional();
export const ukPostcodeSchema = z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i, "Invalid UK postcode").optional();
export const urlSchema = z.string().url("Invalid URL").optional();
export const uuidSchema = z.string().uuid("Invalid ID");
export const positiveInt = z.number().int().positive();
export const positiveMoney = z.number().nonnegative("Amount must be 0 or more");

// ── Auth ─────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.enum(["customer", "vendor"]).default("customer"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
});

// ── Event ────────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  event_type: z.string().min(1, "Event type required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  city: z.string().min(2).max(100),
  guest_count: positiveInt.max(10000),
  budget: positiveMoney.max(1000000),
  notes: z.string().max(2000).optional(),
  theme: z.string().max(200).optional(),
});

// ── Booking ──────────────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  vendor_id: uuidSchema,
  event_id: uuidSchema.optional(),
  package_id: uuidSchema.optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: positiveMoney,
  deposit_amount: positiveMoney,
  notes: z.string().max(2000).optional(),
});

// ── Quote ────────────────────────────────────────────────────────────────────

export const createQuoteSchema = z.object({
  vendor_id: uuidSchema,
  event_id: uuidSchema.optional(),
  event_type: z.string().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guest_count: positiveInt.max(10000),
  budget_min: positiveMoney,
  budget_max: positiveMoney,
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  city: z.string().min(2).max(100),
});

// ── Vendor profile ───────────────────────────────────────────────────────────

export const vendorProfileSchema = z.object({
  business_name: z.string().min(2).max(100),
  category: z.string().min(1),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  city: z.string().min(2).max(100),
  starting_price: positiveMoney,
  phone: phoneSchema,
  website: urlSchema,
  instagram: z.string().max(100).optional(),
  service_areas: z.array(z.string()).max(20).optional(),
});

// ── Message ──────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
  thread_id: uuidSchema.optional(),
  recipient_vendor_id: uuidSchema.optional(),
  booking_id: uuidSchema.optional(),
});

// ── Review ───────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  vendor_id: uuidSchema,
  booking_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

// ── Guest ─────────────────────────────────────────────────────────────────────

export const createGuestSchema = z.object({
  event_id: uuidSchema,
  full_name: z.string().min(1, "Name required").max(100),
  email: z.string().email().max(254).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  is_vip: z.boolean().default(false),
  plus_one_allowed: z.boolean().default(false),
  meal_preference: z.string().max(200).optional().or(z.literal("")),
  dietary_notes: z.string().max(500).optional().or(z.literal("")),
  tags: z.array(z.string().max(50)).max(10).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateGuestSchema = createGuestSchema.partial().extend({
  rsvp_status: z.enum(["pending", "accepted", "declined", "tentative"]).optional(),
  plus_one_name: z.string().max(100).optional().or(z.literal("")),
});

// ── Invitation ────────────────────────────────────────────────────────────────

export const createInvitationSchema = z.object({
  event_id: uuidSchema,
  template: z.enum(["classic", "elegant", "playful", "minimal", "luxury"]).default("classic"),
  title: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  dress_code: z.string().max(200).optional().or(z.literal("")),
  rsvp_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  cover_image_url: z.string().url().max(500).optional().or(z.literal("")),
});

export const updateInvitationSchema = createInvitationSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const rsvpResponseSchema = z.object({
  guest_name: z.string().min(1, "Name required").max(100),
  email: z.string().email().max(254).optional().or(z.literal("")),
  status: z.enum(["accepted", "declined", "tentative"]),
  plus_one: z.boolean().default(false),
  meal_preference: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
}

export function safeParseBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(body);
  if (result.success) return { data: result.data, error: null };
  return { data: null, error: formatZodError(result.error) };
}
