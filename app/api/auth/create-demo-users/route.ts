import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/create-demo-users
 *
 * Creates demo auth users via GoTrue Admin API. No delete logic.
 * Run migration 019_force_demo_auth_cleanup.sql FIRST to wipe corrupted rows,
 * then call this endpoint, then re-run seed.sql for packages/events/bookings.
 *
 * Idempotent: already-clean users return status "already_exists" (treated as OK).
 */

const DEMO_SECRET = "ELBOLD_DEMO_2026";
const DEMO_PASSWORD = "ElboldDemo2026!";

const DEMO_USERS = [
  { id: "a0000001-0000-0000-0000-000000000001", email: "james.bennett@elbold.demo",    name: "James Bennett",    role: "vendor"   },
  { id: "a0000002-0000-0000-0000-000000000002", email: "sofia.martinez@elbold.demo",   name: "Sofia Martinez",   role: "vendor"   },
  { id: "a0000003-0000-0000-0000-000000000003", email: "ravi.patel@elbold.demo",       name: "Ravi Patel",       role: "vendor"   },
  { id: "a0000004-0000-0000-0000-000000000004", email: "charlotte.hughes@elbold.demo", name: "Charlotte Hughes", role: "vendor"   },
  { id: "a0000005-0000-0000-0000-000000000005", email: "marcus.thompson@elbold.demo",  name: "Marcus Thompson",  role: "vendor"   },
  { id: "b0000001-0000-0000-0000-000000000001", email: "emily.carter@elbold.demo",     name: "Emily Carter",     role: "customer" },
  { id: "b0000002-0000-0000-0000-000000000002", email: "oliver.webb@elbold.demo",      name: "Oliver Webb",      role: "customer" },
  { id: "b0000003-0000-0000-0000-000000000003", email: "priya.singh@elbold.demo",      name: "Priya Singh",      role: "customer" },
  { id: "c0000099-0000-0000-0000-000000000099", email: "admin@elbold.demo",            name: "Admin User",       role: "admin"    },
] as const;

// Vendor rows to insert for newly created vendor users.
// Matches seed.sql values so vendor dashboards render correctly.
// Does NOT re-insert packages/events/bookings — run seed.sql for those.
const DEMO_VENDOR_ROWS = [
  {
    user_id:          "a0000001-0000-0000-0000-000000000001",
    business_name:    "Bennett Visuals",
    tagline:          "Capturing moments that last a lifetime",
    category:         "photographer",
    bio:              "Award-winning wedding and events photographer based in London. Specialising in natural, candid photography with a fine-art twist. Over 300 weddings photographed across the UK and Europe.",
    city:             "London",
    address:          "12 Camera Lane, Shoreditch, E1 6RF",
    phone:            "+44 7700 900001",
    travel_radius_km: 80,
    status:           "approved",
    rating:           4.9,
    review_count:     127,
    total_reviews:    127,
    min_price:        800,
    max_price:        3500,
    verified:         true,
    featured:         true,
    years_experience: 12,
    event_types:      ["wedding", "anniversary", "engagement", "corporate"],
    instagram_url:    "https://instagram.com/bennettvisuals",
    website_url:      "https://bennettvisuals.co.uk",
  },
  {
    user_id:          "a0000002-0000-0000-0000-000000000002",
    business_name:    "Sofia Blooms",
    tagline:          "Flowers that tell your story",
    category:         "decorator",
    bio:              "Bespoke floral design studio in Manchester. From intimate table centrepieces to grand ceremony arches, we create breathtaking floral installations tailored to your vision and budget.",
    city:             "Manchester",
    address:          "8 Petal Street, Didsbury, M20 2AB",
    phone:            "+44 7700 900002",
    travel_radius_km: 60,
    status:           "approved",
    rating:           4.7,
    review_count:     89,
    total_reviews:    89,
    min_price:        400,
    max_price:        2000,
    verified:         true,
    featured:         false,
    years_experience: 8,
    event_types:      ["wedding", "birthday", "corporate", "anniversary"],
    instagram_url:    null,
    website_url:      "https://sofiablooms.co.uk",
  },
  {
    user_id:          "a0000003-0000-0000-0000-000000000003",
    business_name:    "Spice & Grace Catering",
    tagline:          "Authentic flavours, elegant presentation",
    category:         "caterer",
    bio:              "Multi-award winning catering company specialising in South Asian cuisine and fusion menus. Fully licensed and insured. Minimum 50 guests. Serving Birmingham and the Midlands.",
    city:             "Birmingham",
    address:          "45 Curry Mile, Sparkbrook, B11 1AL",
    phone:            "+44 7700 900003",
    travel_radius_km: 100,
    status:           "approved",
    rating:           4.8,
    review_count:     64,
    total_reviews:    64,
    min_price:        1500,
    max_price:        8000,
    verified:         true,
    featured:         true,
    years_experience: 15,
    event_types:      ["wedding", "corporate", "birthday", "graduation"],
    instagram_url:    null,
    website_url:      null,
  },
  {
    user_id:          "a0000004-0000-0000-0000-000000000004",
    business_name:    "Charlotte DJ Services",
    tagline:          "Your soundtrack to the perfect night",
    category:         "dj",
    bio:              "Professional mobile DJ with residencies at top London venues. Specialist in weddings, corporate events, and private parties. Full PA, lighting rig, and photo booth available.",
    city:             "London",
    address:          null,
    phone:            "+44 7700 900004",
    travel_radius_km: 120,
    status:           "approved",
    rating:           4.6,
    review_count:     203,
    total_reviews:    203,
    min_price:        300,
    max_price:        1200,
    verified:         false,
    featured:         false,
    years_experience: 6,
    event_types:      ["wedding", "birthday", "corporate", "hen_party", "christmas_party"],
    instagram_url:    "https://instagram.com/charlottedj",
    website_url:      null,
  },
  {
    user_id:          "a0000005-0000-0000-0000-000000000005",
    business_name:    "Marcus Events Decor",
    tagline:          "Transforming spaces into experiences",
    category:         "decorator",
    bio:              "Full event decoration and styling service based in Leeds. Specialising in balloon installations, linen hire, centrepieces, and LED backdrops. Setup and teardown included in all packages.",
    city:             "Leeds",
    address:          "22 Decor Drive, Headingley, LS6 3PQ",
    phone:            "+44 7700 900005",
    travel_radius_km: 80,
    status:           "approved",
    rating:           4.5,
    review_count:     47,
    total_reviews:    47,
    min_price:        300,
    max_price:        2500,
    verified:         false,
    featured:         false,
    years_experience: 4,
    event_types:      ["wedding", "birthday", "corporate", "baby_shower", "graduation"],
    instagram_url:    "https://instagram.com/marcusdecor",
    website_url:      null,
  },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { secret?: string };
    if (body.secret !== DEMO_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const results: { email: string; status: string; actualId?: string; error?: string; triggerCreatedProfile?: boolean }[] = [];

    // ── Step 1: create users via Admin API ───────────────────────────────────
    // Migration 019 must be applied first to clear corrupted rows.
    // Migration 020 must be applied so handle_new_user has SET search_path = public, auth.
    // "already_exists" is treated as success — user is clean from a prior run.
    console.log(`[create-demo-users] starting createUser for ${DEMO_USERS.length} users`);

    for (const user of DEMO_USERS) {
      console.log(`[create-demo-users] → createUser: ${user.email} (requested id: ${user.id}, role: ${user.role})`);
      try {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: user.name, role: user.role },
        });

        if (createErr) {
          // Log full error details — the GoTrue message often wraps the real DB error
          const errStatus = (createErr as { status?: number }).status;
          console.error(
            `[create-demo-users] ✗ createUser failed: ${user.email}\n` +
            `  message : ${createErr.message}\n` +
            `  status  : ${errStatus ?? "n/a"}\n` +
            `  name    : ${createErr.name}\n` +
            `  raw     : ${JSON.stringify(createErr)}`
          );

          const alreadyExists =
            createErr.message?.toLowerCase().includes("already registered") ||
            createErr.message?.toLowerCase().includes("already been registered") ||
            errStatus === 422;

          if (alreadyExists) {
            results.push({ email: user.email, status: "already_exists" });
            continue;
          }

          results.push({ email: user.email, status: "create_failed", error: `${createErr.message} (status: ${errStatus ?? "?"})` });
          continue;
        }

        const actualId = created.user.id;
        const idMatch = actualId === user.id;
        console.log(
          `[create-demo-users] ✓ createUser ok: ${user.email} | ` +
          `actual_id=${actualId} | id_match=${idMatch} | ` +
          `email_confirmed=${created.user.email_confirmed_at != null}`
        );

        // Check whether the handle_new_user trigger created the profile
        const { data: triggerProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", actualId)
          .single();
        console.log(
          `[create-demo-users]   trigger profile: ${triggerProfile ? `role=${triggerProfile.role}` : "NOT CREATED (trigger failed)"}`
        );

        if (!idMatch) {
          await supabase
            .from("profiles")
            .upsert(
              { id: actualId, email: user.email, full_name: user.name, role: user.role },
              { onConflict: "id" }
            );
          results.push({
            email: user.email,
            status: "created_id_mismatch",
            actualId,
            triggerCreatedProfile: !!triggerProfile,
            error: `Requested ${user.id}, got ${actualId}. Profile linked to new id.`,
          });
          continue;
        }

        results.push({ email: user.email, status: "created", actualId, triggerCreatedProfile: !!triggerProfile });
      } catch (err) {
        console.error(`[create-demo-users] ✗ exception for ${user.email}:`, err);
        results.push({ email: user.email, status: "error", error: String(err) });
      }
    }

    // ── Step 2: upsert profiles with correct roles ───────────────────────────
    const profileWarnings: string[] = [];
    for (const user of DEMO_USERS) {
      const result = results.find((r) => r.email === user.email);
      if (result?.status === "create_failed" || result?.status === "error") continue;
      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email, full_name: user.name, role: user.role },
          { onConflict: "id" }
        );
      if (profileErr) profileWarnings.push(`${user.email}: ${profileErr.message}`);
    }

    // ── Step 3: insert vendor rows for newly created vendor users ────────────
    // Skipped for "already_exists" users — their vendor rows are intact.
    const vendorWarnings: string[] = [];
    const newVendorUserIds = DEMO_USERS
      .filter((u) => u.role === "vendor")
      .filter((u) => results.find((r) => r.email === u.email)?.status === "created")
      .map((u) => u.id as string);

    if (newVendorUserIds.length > 0) {
      const rows = DEMO_VENDOR_ROWS.filter((v) => newVendorUserIds.includes(v.user_id as string));
      const { error: vendorErr } = await supabase.from("vendors").insert(rows);
      if (vendorErr) {
        vendorWarnings.push(vendorErr.message);
        console.warn("[create-demo-users] vendor insert error:", vendorErr.message);
      } else {
        console.log(`[create-demo-users] inserted ${rows.length} vendor row(s)`);
      }
    }

    const allOk = results.every((r) =>
      r.status === "created" ||
      r.status === "created_id_mismatch" ||
      r.status === "already_exists"
    );

    return NextResponse.json({
      success: allOk,
      password: DEMO_PASSWORD,
      results,
      profileWarnings: profileWarnings.length > 0 ? profileWarnings : undefined,
      vendorWarnings:  vendorWarnings.length  > 0 ? vendorWarnings  : undefined,
      message: allOk
        ? "All demo users ready. Re-run seed.sql to restore packages, events, and bookings if needed."
        : "Some users failed — run migration 019 first, then retry.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Request failed", details: String(err) },
      { status: 500 }
    );
  }
}
