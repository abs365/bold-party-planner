import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const SEED_SECRET = process.env.SEED_SECRET ?? "ELBOLD_SEED_2026";

// ── Canonical demo user IDs (must match create-demo-users route) ─────────────
const USER = {
  james:     "a0000001-0000-0000-0000-000000000001",
  sofia:     "a0000002-0000-0000-0000-000000000002",
  ravi:      "a0000003-0000-0000-0000-000000000003",
  charlotte: "a0000004-0000-0000-0000-000000000004",
  marcus:    "a0000005-0000-0000-0000-000000000005",
  emily:     "b0000001-0000-0000-0000-000000000001",
  oliver:    "b0000002-0000-0000-0000-000000000002",
  priya:     "b0000003-0000-0000-0000-000000000003",
  admin:     "c0000099-0000-0000-0000-000000000099",
} as const;

const VENDOR_USER_IDS = [USER.james, USER.sofia, USER.ravi, USER.charlotte, USER.marcus];
const CUSTOMER_IDS   = [USER.emily, USER.oliver, USER.priya];
const ALL_DEMO_IDS   = [...VENDOR_USER_IDS, ...CUSTOMER_IDS, USER.admin];

// ── Fixed seed entity IDs ────────────────────────────────────────────────────
const ID = {
  // vendor_packages
  pkg_v1_basic:    "01010001-0000-0000-0000-000000000000",
  pkg_v1_full:     "01010002-0000-0000-0000-000000000000",
  pkg_v1_premium:  "01010003-0000-0000-0000-000000000000",
  pkg_v2_table:    "01020001-0000-0000-0000-000000000000",
  pkg_v2_ceremony: "01020002-0000-0000-0000-000000000000",
  pkg_v3_buffet:   "01030001-0000-0000-0000-000000000000",
  pkg_v3_dinner:   "01030002-0000-0000-0000-000000000000",
  pkg_v3_banquet:  "01030003-0000-0000-0000-000000000000",
  pkg_v4_4hr:      "01040001-0000-0000-0000-000000000000",
  pkg_v4_night:    "01040002-0000-0000-0000-000000000000",
  pkg_v5_balloon:  "01050001-0000-0000-0000-000000000000",
  pkg_v5_full:     "01050002-0000-0000-0000-000000000000",

  // vendor_media
  media_v1_1: "02010001-0000-0000-0000-000000000000",
  media_v1_2: "02010002-0000-0000-0000-000000000000",
  media_v1_3: "02010003-0000-0000-0000-000000000000",
  media_v2_1: "02020001-0000-0000-0000-000000000000",
  media_v2_2: "02020002-0000-0000-0000-000000000000",
  media_v3_1: "02030001-0000-0000-0000-000000000000",
  media_v3_2: "02030002-0000-0000-0000-000000000000",
  media_v4_1: "02040001-0000-0000-0000-000000000000",
  media_v4_2: "02040002-0000-0000-0000-000000000000",
  media_v5_1: "02050001-0000-0000-0000-000000000000",
  media_v5_2: "02050002-0000-0000-0000-000000000000",

  // events
  evt_emily_1:     "03010001-0000-0000-0000-000000000000",
  evt_emily_2:     "03010002-0000-0000-0000-000000000000",
  evt_oliver_1:    "03020001-0000-0000-0000-000000000000",
  evt_oliver_past: "03020002-0000-0000-0000-000000000000",
  evt_priya_1:     "03030001-0000-0000-0000-000000000000",
  evt_priya_2:     "03030002-0000-0000-0000-000000000000",

  // bookings
  booking_oliver_wedding: "06020001-0000-0000-0000-000000000000",
  booking_oliver_past:    "06020002-0000-0000-0000-000000000000",

  // reviews
  review_1: "07000001-0000-0000-0000-000000000000",

  // quotes
  quote_emily_v1:  "04010001-0000-0000-0000-000000000000",
  quote_emily_v4:  "04010002-0000-0000-0000-000000000000",
  quote_oliver_v1: "04020001-0000-0000-0000-000000000000",
  quote_priya_v2:  "04030001-0000-0000-0000-000000000000",

  // quote_responses
  qr_emily_v1:  "05010001-0000-0000-0000-000000000000",
  qr_oliver_v1: "05020001-0000-0000-0000-000000000000",

  // vendor_verifications
  verif_v1: "08010001-0000-0000-0000-000000000000",
  verif_v2: "08020001-0000-0000-0000-000000000000",
  verif_v3: "08030001-0000-0000-0000-000000000000",
  verif_v4: "08040001-0000-0000-0000-000000000000",
  verif_v5: "08050001-0000-0000-0000-000000000000",

  // verification_documents
  vdoc_v1: "09010001-0000-0000-0000-000000000000",
  vdoc_v3: "09030001-0000-0000-0000-000000000000",

  // content_reports
  report_1: "10000001-0000-0000-0000-000000000000",

  // admin_alerts
  alert_1: "11000001-0000-0000-0000-000000000000",
  alert_2: "11000002-0000-0000-0000-000000000000",
  alert_3: "11000003-0000-0000-0000-000000000000",

  // saved_vendors
  saved_emily_v1:  "12000001-0000-0000-0000-000000000000",
  saved_emily_v3:  "12000002-0000-0000-0000-000000000000",
  saved_oliver_v2: "12000003-0000-0000-0000-000000000000",
  saved_priya_v5:  "12000004-0000-0000-0000-000000000000",

  // message_threads
  thread_emily_v1: "13000001-0000-0000-0000-000000000000",

  // messages
  msg_1: "14000001-0000-0000-0000-000000000000",
  msg_2: "14000002-0000-0000-0000-000000000000",
  msg_3: "14000003-0000-0000-0000-000000000000",

  // notifications
  notif_emily_1:  "15000001-0000-0000-0000-000000000000",
  notif_oliver_1: "15000002-0000-0000-0000-000000000000",
  notif_james_1:  "15000003-0000-0000-0000-000000000000",
  notif_sofia_1:  "15000004-0000-0000-0000-000000000000",
  notif_priya_1:  "15000005-0000-0000-0000-000000000000",

  // extra vendor_media for james (reaches 5 items → full media step score)
  media_v1_4: "02010004-0000-0000-0000-000000000000",
  media_v1_5: "02010005-0000-0000-0000-000000000000",

  // vendor_availability
  avail_v1_1: "16010001-0000-0000-0000-000000000000",

  // vendor_warnings (governance seed)
  warn_v4_1: "17040001-0000-0000-0000-000000000000",
  warn_v4_2: "17040002-0000-0000-0000-000000000000",

  // vendor_subscriptions (monetization seed)
  sub_v1: "18010001-0000-0000-0000-000000000000",  // James — elite
  sub_v3: "18030001-0000-0000-0000-000000000000",  // Ravi  — pro
  sub_v4: "18040001-0000-0000-0000-000000000000",  // Charlotte — free (past_due state)

  // extra completed events + bookings + reviews for reputation system
  evt_emily_past:       "03010003-0000-0000-0000-000000000000",
  evt_priya_past:       "03030003-0000-0000-0000-000000000000",
  booking_emily_v1:     "06010001-0000-0000-0000-000000000000",
  booking_priya_v3:     "06030001-0000-0000-0000-000000000000",
  review_2:             "07000002-0000-0000-0000-000000000000",
  review_3:             "07000003-0000-0000-0000-000000000000",
} as const;

export async function POST(request: Request) {
  // Block in production deployments. Vercel production = VERCEL_ENV==="production".
  // Non-Vercel production = NODE_ENV==="production" without CI flag.
  const isProductionDeployment =
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.CI);
  if (isProductionDeployment) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { secret?: string };
    if (body.secret !== SEED_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const errors: string[] = [];
    const log: string[] = [];

    // ── 1. Look up vendor IDs from vendors table (auto-generated UUIDs) ──────
    const { data: vendorRows, error: vendorLookupErr } = await supabase
      .from("vendors")
      .select("id, user_id")
      .in("user_id", VENDOR_USER_IDS);

    if (vendorLookupErr || !vendorRows || vendorRows.length < 5) {
      return NextResponse.json(
        {
          error: "Vendor rows not found. Run /api/auth/create-demo-users first.",
          details: vendorLookupErr?.message,
          found: vendorRows?.length ?? 0,
        },
        { status: 400 }
      );
    }

    const vm: Record<string, string> = {};
    vendorRows.forEach((v) => { vm[v.user_id as string] = v.id as string; });
    const v1 = vm[USER.james];
    const v2 = vm[USER.sofia];
    const v3 = vm[USER.ravi];
    const v4 = vm[USER.charlotte];
    const v5 = vm[USER.marcus];
    const VENDOR_IDS = [v1, v2, v3, v4, v5];
    log.push(`Vendor IDs resolved: ${VENDOR_IDS.length}/5`);

    // ── 2. Delete existing seed data in reverse dependency order ─────────────
    await supabase.from("subscription_billing_events").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("vendor_subscriptions").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("vendor_warnings").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("admin_alerts").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("verification_activity_log").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("verification_documents").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("vendor_verifications").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("saved_vendors").delete().in("customer_id", CUSTOMER_IDS);
    await supabase.from("content_reports").delete().in("reporter_id", ALL_DEMO_IDS as unknown as string[]);
    await supabase.from("message_threads").delete().in("customer_id", CUSTOMER_IDS);
    // reviews → bookings must be deleted before events (FK references)
    await supabase.from("review_reports").delete().in("reporter_id", ALL_DEMO_IDS as unknown as string[]);
    await supabase.from("reviews").delete().in("customer_id", CUSTOMER_IDS);
    await supabase.from("bookings").delete().in("customer_id", CUSTOMER_IDS);
    await supabase.from("quotes").delete().in("customer_id", CUSTOMER_IDS);
    await supabase.from("events").delete().in("customer_id", CUSTOMER_IDS);
    await supabase.from("notifications").delete().in("user_id", ALL_DEMO_IDS as unknown as string[]);
    await supabase.from("vendor_availability").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("vendor_media").delete().in("vendor_id", VENDOR_IDS);
    await supabase.from("vendor_packages").delete().in("vendor_id", VENDOR_IDS);
    log.push("Delete phase complete");

    // ── 3. vendor_packages ───────────────────────────────────────────────────
    const { error: pkgErr } = await supabase.from("vendor_packages").insert([
      // James Bennett — photographer
      { id: ID.pkg_v1_basic,    vendor_id: v1, name: "Essential Coverage",    description: "4-hour event photography. 150 hand-edited images delivered via online gallery.",        price: 800,  duration_hours: 4,  includes: ["150 edited images", "Online gallery", "1 photographer"],                                  is_popular: false },
      { id: ID.pkg_v1_full,     vendor_id: v1, name: "Full Day Coverage",     description: "8-hour event photography. 400 edited images, 2 photographers, printed album.",          price: 1800, duration_hours: 8,  includes: ["400 edited images", "Online gallery", "Printed album", "2 photographers"],              is_popular: true  },
      { id: ID.pkg_v1_premium,  vendor_id: v1, name: "Premium Experience",    description: "12-hour coverage plus engagement shoot. 600 edited images, luxury album.",              price: 3200, duration_hours: 12, includes: ["600 edited images", "Luxury album", "Engagement shoot", "Same-day preview reel"],      is_popular: false },
      // Sofia Blooms — decorator
      { id: ID.pkg_v2_table,    vendor_id: v2, name: "Table Centrepieces",    description: "Up to 10 seasonal floral centrepieces. Setup and teardown included.",                    price: 450,  duration_hours: 3,  includes: ["Up to 10 centrepieces", "Seasonal flowers", "Setup & teardown"],                       is_popular: false },
      { id: ID.pkg_v2_ceremony, vendor_id: v2, name: "Full Ceremony Package", description: "Ceremony arch, aisle flowers, bridal bouquet, and 6 buttonholes.",                       price: 1400, duration_hours: 6,  includes: ["Ceremony arch", "Aisle décor", "Bridal bouquet", "6 buttonholes", "Consultation"], is_popular: true  },
      // Spice & Grace — caterer
      { id: ID.pkg_v3_buffet,   vendor_id: v3, name: "Celebration Buffet",    description: "South Asian buffet for up to 50 guests. 6 mains, rice, breads, soft drinks.",           price: 1800, duration_hours: 4,  includes: ["6 mains", "Rice & breads", "Soft drinks", "Disposable crockery", "Setup"],           is_popular: false },
      { id: ID.pkg_v3_dinner,   vendor_id: v3, name: "Seated Dinner",         description: "3-course seated meal for up to 80 guests. China crockery and table linen.",             price: 4800, duration_hours: 6,  includes: ["3-course meal", "China crockery", "Table linen", "Serving staff", "Event manager"], is_popular: true  },
      { id: ID.pkg_v3_banquet,  vendor_id: v3, name: "Grand Banquet",         description: "5-course banquet for up to 150 guests. Premium presentation and full bar.",              price: 7800, duration_hours: 8,  includes: ["5-course meal", "Full bar", "Premium presentation", "Dedicated event manager"],      is_popular: false },
      // Charlotte DJ
      { id: ID.pkg_v4_4hr,      vendor_id: v4, name: "Party Starter",         description: "4-hour DJ set with PA system and basic uplighting.",                                     price: 350,  duration_hours: 4,  includes: ["4-hour DJ set", "PA system", "Basic uplighting"],                                   is_popular: false },
      { id: ID.pkg_v4_night,    vendor_id: v4, name: "Full Night Party",      description: "8-hour DJ set with full PA rig, LED lighting wall, and photo booth.",                   price: 850,  duration_hours: 8,  includes: ["8-hour DJ set", "Full PA rig", "LED lighting wall", "Photo booth", "MC duties"],    is_popular: true  },
      // Marcus Events Decor
      { id: ID.pkg_v5_balloon,  vendor_id: v5, name: "Balloon Arch",          description: "Organic balloon arch up to 2m wide. Colour matching and installation included.",        price: 320,  duration_hours: 2,  includes: ["Organic balloon arch", "Colour matching", "Setup & teardown"],                       is_popular: false },
      { id: ID.pkg_v5_full,     vendor_id: v5, name: "Full Room Styling",     description: "Complete room transformation — linen, centrepieces, LED backdrop, balloon columns.",    price: 1400, duration_hours: 5,  includes: ["Centrepieces", "LED backdrop", "Linen hire", "Balloon columns", "LED letter hire"], is_popular: true  },
    ]);
    if (pkgErr) errors.push(`packages: ${pkgErr.message}`);
    else log.push("Inserted 12 vendor packages");

    // ── 4. vendor_media ──────────────────────────────────────────────────────
    const { error: mediaErr } = await supabase.from("vendor_media").insert([
      { id: ID.media_v1_1, vendor_id: v1, url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", type: "image", caption: "Candid wedding portrait",         is_cover: true,  sort_order: 1, moderation_status: "approved" },
      { id: ID.media_v1_2, vendor_id: v1, url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", type: "image", caption: "First dance moment",              is_cover: false, sort_order: 2, moderation_status: "approved" },
      { id: ID.media_v1_3, vendor_id: v1, url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800", type: "image", caption: "Bridal party portrait",           is_cover: false, sort_order: 3, moderation_status: "approved" },
      { id: ID.media_v1_4, vendor_id: v1, url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800", type: "image", caption: "Engagement session portraits",    is_cover: false, sort_order: 4, moderation_status: "approved" },
      { id: ID.media_v1_5, vendor_id: v1, url: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800", type: "image", caption: "Golden hour reception details",  is_cover: false, sort_order: 5, moderation_status: "approved" },
      { id: ID.media_v2_1, vendor_id: v2, url: "https://images.unsplash.com/photo-1487530811015-780780ebc04a?w=800", type: "image", caption: "Ceremony arch in full bloom",     is_cover: true,  sort_order: 1, moderation_status: "approved" },
      { id: ID.media_v2_2, vendor_id: v2, url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800", type: "image", caption: "Table centrepiece arrangement",   is_cover: false, sort_order: 2, moderation_status: "approved" },
      { id: ID.media_v3_1, vendor_id: v3, url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800", type: "image", caption: "South Asian banquet spread",      is_cover: true,  sort_order: 1, moderation_status: "approved" },
      { id: ID.media_v3_2, vendor_id: v3, url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800", type: "image", caption: "Canapé selection",                is_cover: false, sort_order: 2, moderation_status: "approved" },
      { id: ID.media_v4_1, vendor_id: v4, url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800", type: "image", caption: "DJ setup at wedding reception",   is_cover: true,  sort_order: 1, moderation_status: "approved" },
      { id: ID.media_v4_2, vendor_id: v4, url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800", type: "image", caption: "Dance floor in full swing",       is_cover: false, sort_order: 2, moderation_status: "approved" },
      { id: ID.media_v5_1, vendor_id: v5, url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", type: "image", caption: "Organic balloon arch installation", is_cover: true,  sort_order: 1, moderation_status: "approved" },
      { id: ID.media_v5_2, vendor_id: v5, url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800", type: "image", caption: "LED backdrop and centrepieces",   is_cover: false, sort_order: 2, moderation_status: "approved" },
    ]);
    if (mediaErr) errors.push(`media: ${mediaErr.message}`);
    else log.push("Inserted 13 vendor media items");

    // ── 5. vendor_verifications ──────────────────────────────────────────────
    const { error: verifErr } = await supabase.from("vendor_verifications").insert([
      { id: ID.verif_v1, vendor_id: v1, type: "identity", status: "approved",  submitted_at: "2026-01-10T10:00:00Z", reviewed_at: "2026-01-12T14:00:00Z", reviewer_id: USER.admin, notes: "Document verified successfully." },
      { id: ID.verif_v2, vendor_id: v2, type: "identity", status: "pending",   submitted_at: "2026-05-20T09:00:00Z" },
      { id: ID.verif_v3, vendor_id: v3, type: "identity", status: "approved",  submitted_at: "2026-02-05T11:00:00Z", reviewed_at: "2026-02-07T10:00:00Z", reviewer_id: USER.admin, notes: "Verified." },
      { id: ID.verif_v4, vendor_id: v4, type: "identity", status: "rejected",  submitted_at: "2026-04-01T08:00:00Z", reviewed_at: "2026-04-03T16:00:00Z", reviewer_id: USER.admin, rejection_reason: "Identity document was unclear. Please resubmit with a legible photo.", resubmission_allowed: true },
      { id: ID.verif_v5, vendor_id: v5, type: "identity", status: "pending",   submitted_at: "2026-05-25T14:00:00Z" },
    ]);
    if (verifErr) errors.push(`verifications: ${verifErr.message}`);
    else log.push("Inserted 5 vendor verifications");

    // Update verification_level to match approved verifications
    await supabase.from("vendors").update({ verification_level: 2 }).eq("id", v1);
    await supabase.from("vendors").update({ verification_level: 1 }).eq("id", v3);

    // ── 5b. vendor_availability ──────────────────────────────────────────────
    // Seed one available date for James so his trust step scores as complete.
    const { error: availErr } = await supabase.from("vendor_availability").insert([
      { id: ID.avail_v1_1, vendor_id: v1, date: "2026-07-01", is_available: true },
    ]);
    if (availErr) errors.push(`vendor_availability: ${availErr.message}`);
    else log.push("Inserted 1 availability record");

    // ── 6. verification_documents ────────────────────────────────────────────
    const { error: vdocErr } = await supabase.from("verification_documents").insert([
      { id: ID.vdoc_v1, verification_id: ID.verif_v1, vendor_id: v1, document_type: "passport",        file_url: "https://example.com/seed/v1-passport.pdf",  file_name: "passport.pdf",         file_size: 204800, mime_type: "application/pdf", is_primary: true },
      { id: ID.vdoc_v3, verification_id: ID.verif_v3, vendor_id: v3, document_type: "driving_license", file_url: "https://example.com/seed/v3-license.pdf",   file_name: "driving_license.pdf",  file_size: 153600, mime_type: "application/pdf", is_primary: true },
    ]);
    if (vdocErr) errors.push(`verification_documents: ${vdocErr.message}`);
    else log.push("Inserted 2 verification documents");

    // ── 7. events ────────────────────────────────────────────────────────────
    const { error: evtErr } = await supabase.from("events").insert([
      { id: ID.evt_emily_1,     customer_id: USER.emily,  title: "Emily's Birthday Bash",       event_type: "birthday",   date: "2026-07-15", city: "London",     guest_count: 60,  budget: 3000,  status: "planning",  venue_name: "The Venue at Shoreditch" },
      { id: ID.evt_emily_2,     customer_id: USER.emily,  title: "Summer Garden Party",         event_type: "anniversary",date: "2026-09-20", city: "London",     guest_count: 40,  budget: 2000,  status: "draft" },
      { id: ID.evt_oliver_1,    customer_id: USER.oliver, title: "Oliver & Emma's Wedding",     event_type: "wedding",    date: "2026-08-10", city: "London",     guest_count: 120, budget: 20000, status: "confirmed", venue_name: "Kew Gardens Orangery" },
      { id: ID.evt_oliver_past, customer_id: USER.oliver, title: "Team Building Corporate Day", event_type: "corporate",  date: "2026-04-20", city: "London",     guest_count: 50,  budget: 5000,  status: "completed" },
      { id: ID.evt_priya_1,     customer_id: USER.priya,  title: "Priya's Baby Shower",         event_type: "baby_shower",date: "2026-06-22", city: "Birmingham", guest_count: 30,  budget: 1500,  status: "planning" },
      { id: ID.evt_priya_2,     customer_id: USER.priya,  title: "Graduation Celebration",      event_type: "graduation", date: "2026-11-08", city: "Birmingham", guest_count: 25,  budget: 1000,  status: "draft" },
    ]);
    if (evtErr) errors.push(`events: ${evtErr.message}`);
    else log.push("Inserted 6 events");

    // ── 8. bookings ──────────────────────────────────────────────────────────
    const { error: bookingErr } = await supabase.from("bookings").insert([
      {
        id:              ID.booking_oliver_wedding,
        event_id:        ID.evt_oliver_1,
        vendor_id:       v1,
        package_id:      ID.pkg_v1_full,
        customer_id:     USER.oliver,
        status:          "confirmed",
        payment_status:  "deposit_paid",
        total_amount:    1800,
        deposit_amount:  500,
        commission_amount: 180,
        vendor_payout:   1120,
        notes:           "Full day wedding photography. 2 photographers, printed album.",
        confirmed_at:    "2026-05-01T10:00:00Z",
      },
      {
        id:              ID.booking_oliver_past,
        event_id:        ID.evt_oliver_past,
        vendor_id:       v4,
        package_id:      ID.pkg_v4_night,
        customer_id:     USER.oliver,
        status:          "completed",
        payment_status:  "fully_paid",
        total_amount:    850,
        deposit_amount:  200,
        commission_amount: 85,
        vendor_payout:   565,
        notes:           "DJ and photo booth for corporate team day.",
        confirmed_at:    "2026-03-15T10:00:00Z",
        completed_at:    "2026-04-20T22:00:00Z",
      },
    ]);
    if (bookingErr) errors.push(`bookings: ${bookingErr.message}`);
    else log.push("Inserted 2 bookings");

    // ── 9. events (past completed — needed for reputation reviews) ───────────
    const { error: pastEvtErr } = await supabase.from("events").insert([
      { id: ID.evt_emily_past,  customer_id: USER.emily,  title: "Emily's Anniversary Dinner",    event_type: "anniversary", date: "2026-03-10", city: "London",     guest_count: 20, budget: 1500, status: "completed" },
      { id: ID.evt_priya_past,  customer_id: USER.priya,  title: "Priya's Corporate Evening",     event_type: "corporate",   date: "2026-02-14", city: "Birmingham", guest_count: 40, budget: 4000, status: "completed" },
    ]);
    if (pastEvtErr) errors.push(`past events: ${pastEvtErr.message}`);
    else log.push("Inserted 2 past completed events");

    // ── 9b. bookings (completed — needed for reputation reviews) ─────────────
    const { error: repBookingErr } = await supabase.from("bookings").insert([
      {
        id:               ID.booking_emily_v1,
        event_id:         ID.evt_emily_past,
        vendor_id:        v1,
        package_id:       ID.pkg_v1_basic,
        customer_id:      USER.emily,
        status:           "completed",
        payment_status:   "fully_paid",
        total_amount:     800,
        deposit_amount:   200,
        commission_amount: 80,
        vendor_payout:    520,
        confirmed_at:     "2026-02-20T10:00:00Z",
      },
      {
        id:               ID.booking_priya_v3,
        event_id:         ID.evt_priya_past,
        vendor_id:        v3,
        package_id:       ID.pkg_v3_buffet,
        customer_id:      USER.priya,
        status:           "completed",
        payment_status:   "fully_paid",
        total_amount:     1800,
        deposit_amount:   500,
        commission_amount: 180,
        vendor_payout:    1120,
        confirmed_at:     "2026-01-28T10:00:00Z",
      },
    ]);
    if (repBookingErr) errors.push(`reputation bookings: ${repBookingErr.message}`);
    else log.push("Inserted 2 completed bookings for reputation reviews");

    // ── 9c. reviews (with sub-ratings for reputation system) ─────────────────
    const { error: reviewErr } = await supabase.from("reviews").insert([
      {
        id:                     ID.review_1,
        booking_id:             ID.booking_oliver_past,
        vendor_id:              v4,
        customer_id:            USER.oliver,
        rating:                 5,
        comment:                "Charlotte was absolutely amazing. The dance floor was packed all night. Perfect music selection for a corporate event — great read of the room.",
        response:               "Thank you Oliver! It was a pleasure working with your team. Look forward to seeing you again!",
        response_at:            "2026-04-22T09:00:00Z",
        communication_rating:   5,
        professionalism_rating: 4,
        punctuality_rating:     5,
        quality_rating:         5,
        value_rating:           4,
        moderation_status:      "approved",
        is_verified:            true,
        verified_at:            "2026-04-21T10:00:00Z",
      },
      {
        id:                     ID.review_2,
        booking_id:             ID.booking_emily_v1,
        vendor_id:              v1,
        customer_id:            USER.emily,
        rating:                 5,
        comment:                "James captured every moment perfectly. The photos are stunning — natural light, candid shots exactly as requested. Incredibly professional and responsive throughout.",
        communication_rating:   5,
        professionalism_rating: 5,
        punctuality_rating:     5,
        quality_rating:         5,
        value_rating:           5,
        moderation_status:      "approved",
        is_verified:            true,
        verified_at:            "2026-03-12T10:00:00Z",
      },
      {
        id:                     ID.review_3,
        booking_id:             ID.booking_priya_v3,
        vendor_id:              v3,
        customer_id:            USER.priya,
        rating:                 5,
        comment:                "Spice & Grace delivered an extraordinary buffet. The food was rich, flavoursome, and beautifully presented. Every guest complimented the spread. Will absolutely use again!",
        communication_rating:   5,
        professionalism_rating: 5,
        punctuality_rating:     5,
        quality_rating:         5,
        value_rating:           4,
        moderation_status:      "approved",
        is_verified:            true,
        verified_at:            "2026-02-16T10:00:00Z",
      },
    ]);
    if (reviewErr) errors.push(`reviews: ${reviewErr.message}`);
    else log.push("Inserted 3 verified reviews with sub-ratings");

    // ── 10. quotes ───────────────────────────────────────────────────────────
    const { error: quoteErr } = await supabase.from("quotes").insert([
      {
        id:          ID.quote_emily_v1,
        customer_id: USER.emily,
        vendor_id:   v1,
        event_id:    ID.evt_emily_1,
        status:      "responded",
        message:     "Hi James, I'd love to discuss photography for my birthday party.",
        requirements: "Candid shots, natural light preferred. Group photos essential.",
        event_date:  "2026-07-15",
        event_type:  "birthday",
        guest_count: 60,
        budget_min:  600,
        budget_max:  1000,
      },
      {
        id:          ID.quote_emily_v4,
        customer_id: USER.emily,
        vendor_id:   v4,
        event_id:    ID.evt_emily_1,
        status:      "pending",
        message:     "Looking for a DJ for my birthday party in July. Great dance floor energy is a must!",
        event_date:  "2026-07-15",
        event_type:  "birthday",
        guest_count: 60,
        budget_min:  300,
        budget_max:  600,
      },
      {
        id:                  ID.quote_oliver_v1,
        customer_id:         USER.oliver,
        vendor_id:           v1,
        event_id:            ID.evt_oliver_1,
        status:              "accepted",
        message:             "We'd like full day coverage for our wedding. Two photographers preferred.",
        event_date:          "2026-08-10",
        event_type:          "wedding",
        guest_count:         120,
        budget_min:          1500,
        budget_max:          2500,
        converted_booking_id: ID.booking_oliver_wedding,
        accepted_at:         "2026-05-01T09:30:00Z",
      },
      {
        id:          ID.quote_priya_v2,
        customer_id: USER.priya,
        vendor_id:   v2,
        event_id:    ID.evt_priya_1,
        status:      "pending",
        message:     "Looking for floral arrangements for a baby shower. Soft pink and white colour scheme.",
        event_date:  "2026-06-22",
        event_type:  "baby_shower",
        guest_count: 30,
        budget_min:  200,
        budget_max:  500,
      },
    ]);
    if (quoteErr) errors.push(`quotes: ${quoteErr.message}`);
    else log.push("Inserted 4 quotes");

    // ── 11. quote_responses ──────────────────────────────────────────────────
    const { error: qrErr } = await supabase.from("quote_responses").insert([
      {
        id:             ID.qr_emily_v1,
        quote_id:       ID.quote_emily_v1,
        vendor_id:      v1,
        price:          850,
        deposit_amount: 250,
        message:        "Hi Emily! I'd love to photograph your birthday. The Essential Coverage package (150 edited images, 4 hours) would be ideal.",
        includes:       ["150 edited images", "Online gallery", "4 hours coverage", "1 photographer"],
        valid_until:    "2026-06-30",
        status:         "pending",
      },
      {
        id:             ID.qr_oliver_v1,
        quote_id:       ID.quote_oliver_v1,
        vendor_id:      v1,
        price:          1800,
        deposit_amount: 500,
        message:        "Congratulations on your upcoming wedding! I'd be honoured to be there. Full Day Coverage with 2 photographers and a printed album.",
        includes:       ["400 edited images", "Printed album", "8 hours coverage", "2 photographers"],
        valid_until:    "2026-07-01",
        status:         "accepted",
      },
    ]);
    if (qrErr) errors.push(`quote_responses: ${qrErr.message}`);
    else log.push("Inserted 2 quote responses");

    // ── 12. saved_vendors ────────────────────────────────────────────────────
    const { error: savedErr } = await supabase.from("saved_vendors").insert([
      { id: ID.saved_emily_v1,  customer_id: USER.emily,  vendor_id: v1 },
      { id: ID.saved_emily_v3,  customer_id: USER.emily,  vendor_id: v3 },
      { id: ID.saved_oliver_v2, customer_id: USER.oliver, vendor_id: v2 },
      { id: ID.saved_priya_v5,  customer_id: USER.priya,  vendor_id: v5 },
    ]);
    if (savedErr) errors.push(`saved_vendors: ${savedErr.message}`);
    else log.push("Inserted 4 saved vendors");

    // ── 13. content_reports ──────────────────────────────────────────────────
    const { error: reportErr } = await supabase.from("content_reports").insert([
      {
        id:           ID.report_1,
        reporter_id:  USER.emily,
        content_type: "vendor_media",
        content_id:   ID.media_v4_2,
        vendor_id:    v4,
        reason:       "inappropriate",
        details:      "This image appears to show a private event without the consent of those pictured.",
        status:       "open",
      },
    ]);
    if (reportErr) errors.push(`content_reports: ${reportErr.message}`);
    else log.push("Inserted 1 content report");

    // ── 14. admin_alerts ─────────────────────────────────────────────────────
    const { error: alertErr } = await supabase.from("admin_alerts").insert([
      {
        id:              ID.alert_1,
        type:            "verification_submitted",
        title:           "New verification — Sofia Blooms",
        body:            "Identity document submitted and awaiting review.",
        vendor_id:       v2,
        verification_id: ID.verif_v2,
        severity:        "info",
        read:            false,
      },
      {
        id:              ID.alert_2,
        type:            "verification_submitted",
        title:           "New verification — Marcus Events Decor",
        body:            "Identity document submitted and awaiting review.",
        vendor_id:       v5,
        verification_id: ID.verif_v5,
        severity:        "info",
        read:            false,
      },
      {
        id:       ID.alert_3,
        type:     "multiple_reports",
        title:    "Content report filed — Charlotte DJ Services",
        body:     "A media item has been flagged as potentially inappropriate.",
        vendor_id: v4,
        severity: "warning",
        read:     false,
      },
    ]);
    if (alertErr) errors.push(`admin_alerts: ${alertErr.message}`);
    else log.push("Inserted 3 admin alerts");

    // ── 15. message_threads + messages ───────────────────────────────────────
    const { error: threadErr } = await supabase.from("message_threads").insert([
      {
        id:               ID.thread_emily_v1,
        quote_id:         ID.quote_emily_v1,
        customer_id:      USER.emily,
        vendor_id:        v1,
        subject:          "Photography enquiry — Emily's Birthday Bash",
        last_message_at:  "2026-05-26T15:30:00Z",
      },
    ]);
    if (threadErr) {
      errors.push(`message_threads: ${threadErr.message}`);
    } else {
      const { error: msgErr } = await supabase.from("messages").insert([
        {
          id:                ID.msg_1,
          thread_id:         ID.thread_emily_v1,
          sender_id:         USER.emily,
          content:           "Hi James! I love your portfolio. Do you have availability on 15th July for a birthday party in Shoreditch?",
          read_by_customer:  true,
          read_by_vendor:    true,
          created_at:        "2026-05-24T10:00:00Z",
        },
        {
          id:                ID.msg_2,
          thread_id:         ID.thread_emily_v1,
          sender_id:         USER.james,
          content:           "Hi Emily! Yes, I'm available on 15th July. I'd love to capture your birthday. I've sent across a quote for the Essential Coverage package — 150 edited images, 4 hours.",
          read_by_customer:  true,
          read_by_vendor:    true,
          created_at:        "2026-05-24T14:00:00Z",
        },
        {
          id:                ID.msg_3,
          thread_id:         ID.thread_emily_v1,
          sender_id:         USER.emily,
          content:           "That sounds great! I'll review the quote and get back to you by the end of the week.",
          read_by_customer:  true,
          read_by_vendor:    false,
          created_at:        "2026-05-26T15:30:00Z",
        },
      ]);
      if (msgErr) errors.push(`messages: ${msgErr.message}`);
      else log.push("Inserted 1 message thread, 3 messages");
    }

    // ── 16. notifications ────────────────────────────────────────────────────
    const { error: notifErr } = await supabase.from("notifications").insert([
      { id: ID.notif_emily_1,  user_id: USER.emily,  title: "Quote received",          message: "Bennett Visuals has responded to your photography quote for Emily's Birthday Bash.",        type: "booking",  read: false, link: "/dashboard/quotes" },
      { id: ID.notif_oliver_1, user_id: USER.oliver, title: "Booking confirmed",        message: "Your photography booking with Bennett Visuals for Oliver & Emma's Wedding is confirmed.", type: "booking",  read: false, link: "/dashboard/bookings" },
      { id: ID.notif_james_1,  user_id: USER.james,  title: "New booking confirmed",    message: "Oliver Webb has confirmed a photography booking for their wedding on 10th August.",       type: "booking",  read: false, link: "/vendor/dashboard" },
      { id: ID.notif_sofia_1,  user_id: USER.sofia,  title: "New quote request",        message: "Priya Singh has requested a quote for floral arrangements for a baby shower.",            type: "booking",  read: false, link: "/vendor/dashboard" },
      { id: ID.notif_priya_1,  user_id: USER.priya,  title: "Event coming up",          message: "Priya's Baby Shower is on 22nd June. Make sure all your vendors are booked!",            type: "reminder", read: false, link: "/dashboard/events" },
    ]);
    if (notifErr) errors.push(`notifications: ${notifErr.message}`);
    else log.push("Inserted 5 notifications");

    // ── 17. Onboarding + governance test states ──────────────────────────────
    // Set deterministic vendor states so Playwright tests can cover all flows:
    //   v1 (James)     — approved, level 2, 5 media, availability → score 100 "Fully Optimised"
    //   v2 (Sofia)     — pending  → "Application Under Review" page
    //   v3 (Ravi)      — approved, level 1, response_rate=85 → Good health
    //   v4 (Charlotte) — approved, level 0, cancellation_rate=35 → at_risk, has warnings
    //   v5 (Marcus)    — suspended → "Account Suspended" page
    await supabase.from("vendors").update({ status: "pending" }).eq("id", v2);
    await supabase.from("vendors").update({ status: "suspended" }).eq("id", v5);
    // Give Charlotte at-risk metrics so governance tests can verify warning display
    await supabase.from("vendors").update({ cancellation_rate: 35, response_rate: 32 }).eq("id", v4);
    // Give Ravi healthy SLA metrics
    await supabase.from("vendors").update({ response_rate: 85, cancellation_rate: 3 }).eq("id", v3);
    log.push("Set onboarding test states: sofia=pending, marcus=suspended, charlotte=at_risk");

    // ── 18. Governance warnings (Charlotte is at-risk) ───────────────────────
    const { error: warnErr } = await supabase.from("vendor_warnings").insert([
      {
        id:             ID.warn_v4_1,
        vendor_id:      v4,
        type:           "excessive_cancellations",
        severity:       "high",
        title:          "High Cancellation Rate",
        message:        "Cancellation rate is 35% — above the 20% threshold. This is reducing your marketplace visibility.",
        auto_generated: true,
        resolved:       false,
      },
      {
        id:             ID.warn_v4_2,
        vendor_id:      v4,
        type:           "low_response_rate",
        severity:       "high",
        title:          "Very Low Response Rate",
        message:        "Response rate is 32% — below the 40% minimum. Responding within 24 hours will restore visibility.",
        auto_generated: true,
        resolved:       false,
      },
    ]);
    if (warnErr) errors.push(`vendor_warnings: ${warnErr.message}`);
    else log.push("Inserted 2 governance warnings for Charlotte (at-risk state)");

    // ── 19. Subscription states ─────────────────────────────────────────────
    // Deterministic subscription states for Playwright coverage:
    //   v1 (James)     — elite plan, active
    //   v3 (Ravi)      — pro plan, active
    //   v4 (Charlotte) — free, past_due (simulates failed payment)
    const { error: subErr } = await supabase.from("vendor_subscriptions").insert([
      {
        id:                   ID.sub_v1,
        vendor_id:            v1,
        plan:                 "elite",
        status:               "active",
        billing_cycle:        "monthly",
        current_period_start: "2026-05-01T00:00:00Z",
        current_period_end:   "2026-06-01T00:00:00Z",
        cancel_at_period_end: false,
        failed_payment_count: 0,
        last_payment_at:      "2026-05-01T00:00:00Z",
      },
      {
        id:                   ID.sub_v3,
        vendor_id:            v3,
        plan:                 "pro",
        status:               "active",
        billing_cycle:        "monthly",
        current_period_start: "2026-05-15T00:00:00Z",
        current_period_end:   "2026-06-15T00:00:00Z",
        cancel_at_period_end: false,
        failed_payment_count: 0,
        last_payment_at:      "2026-05-15T00:00:00Z",
      },
      {
        id:                   ID.sub_v4,
        vendor_id:            v4,
        plan:                 "free",
        status:               "past_due",
        billing_cycle:        "monthly",
        failed_payment_count: 2,
      },
    ]);
    if (subErr) errors.push(`vendor_subscriptions: ${subErr.message}`);
    else {
      // Sync subscription_plan + featured on vendor rows
      await supabase.from("vendors").update({ subscription_plan: "elite", featured: true }).eq("id", v1);
      await supabase.from("vendors").update({ subscription_plan: "pro"   }).eq("id", v3);
      log.push("Inserted 3 vendor subscriptions: james=elite, ravi=pro, charlotte=past_due");
    }

    return NextResponse.json({
      success: errors.length === 0,
      log,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0
        ? "E2E seed complete. All demo data ready."
        : `Seed partially failed. ${errors.length} error(s). Check errors[] for details.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Seed failed", details: String(err) },
      { status: 500 }
    );
  }
}
