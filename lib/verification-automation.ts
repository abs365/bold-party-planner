import type { SupabaseClient } from "@supabase/supabase-js";

export interface VendorMetrics {
  completed_jobs_count: number;
  response_rate: number | null;
  cancellation_rate: number | null;
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export async function computeVendorMetrics(
  vendorId: string,
  supabase: SupabaseClient
): Promise<VendorMetrics> {
  const [bookingsRes, quotesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("status")
      .eq("vendor_id", vendorId)
      .in("status", ["completed", "cancelled"]),

    supabase
      .from("quotes")
      .select("responded_at, created_at")
      .eq("vendor_id", vendorId)
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const bookings = bookingsRes.data ?? [];
  const quotes = quotesRes.data ?? [];

  const completedJobs = bookings.filter((b) => b.status === "completed").length;

  const cancellationRate =
    bookings.length > 0
      ? Math.round(
          (bookings.filter((b) => b.status === "cancelled").length / bookings.length) * 10000
        ) / 100
      : null;

  const respondedWithin24h = quotes.filter((q) => {
    if (!q.responded_at) return false;
    return (
      new Date(q.responded_at).getTime() - new Date(q.created_at).getTime() <=
      24 * 60 * 60 * 1000
    );
  }).length;

  const responseRate =
    quotes.length > 0
      ? Math.round((respondedWithin24h / quotes.length) * 10000) / 100
      : null;

  return { completed_jobs_count: completedJobs, response_rate: responseRate, cancellation_rate: cancellationRate };
}

export async function updateVendorMetrics(
  vendorId: string,
  supabase: SupabaseClient
): Promise<VendorMetrics> {
  const metrics = await computeVendorMetrics(vendorId, supabase);
  await supabase.from("vendors").update({
    ...metrics,
    metrics_updated_at: new Date().toISOString(),
  }).eq("id", vendorId);
  return metrics;
}

// ── Level 1 auto-upgrade ──────────────────────────────────────────────────────

export async function tryUpgradeLevel1(
  vendorId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: vendor } = await supabase
    .from("vendors")
    .select("verification_level, bio, city, phone")
    .eq("id", vendorId)
    .single();

  if (!vendor || vendor.verification_level >= 1) return false;

  const [profileRes, mediaRes, packagesRes] = await Promise.all([
    supabase.from("profiles").select("phone, email").eq("id", userId).single(),
    supabase
      .from("vendor_media")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .is("deleted_at", null),
    supabase
      .from("vendor_packages")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId),
  ]);

  const profile = profileRes.data;
  const conditions = {
    emailExists: !!profile?.email,
    phoneAdded: !!(profile?.phone || vendor.phone),
    bioComplete: !!(vendor.bio && vendor.bio.length >= 20),
    cityAdded: !!vendor.city,
    hasMedia: (mediaRes.count ?? 0) >= 3,
    hasPackages: (packagesRes.count ?? 0) >= 1,
  };

  if (!Object.values(conditions).every(Boolean)) return false;

  await supabase.from("vendors").update({ verification_level: 1 }).eq("id", vendorId);
  await supabase.from("verification_activity_log").insert({
    vendor_id: vendorId,
    actor_type: "system",
    action: "level_upgraded",
    old_level: 0,
    new_level: 1,
    notes: "Level 1 auto-upgrade: all profile requirements met",
  });

  return true;
}

// ── Level 3 auto-upgrade ──────────────────────────────────────────────────────

export async function tryUpgradeLevel3(
  vendorId: string,
  supabase: SupabaseClient,
  freshMetrics?: VendorMetrics
): Promise<boolean> {
  const { data: vendor } = await supabase
    .from("vendors")
    .select("verification_level, rating, completed_jobs_count, response_rate, cancellation_rate")
    .eq("id", vendorId)
    .single();

  if (!vendor) return false;
  // Must be Level 2 to upgrade to Level 3
  if (vendor.verification_level !== 2) return false;

  const m = freshMetrics ?? {
    completed_jobs_count: vendor.completed_jobs_count ?? 0,
    response_rate: vendor.response_rate,
    cancellation_rate: vendor.cancellation_rate,
  };

  const meetsLevel3 =
    m.completed_jobs_count >= 5 &&
    (vendor.rating ?? 0) >= 4.5 &&
    (m.response_rate ?? 0) >= 80 &&
    (m.cancellation_rate === null || m.cancellation_rate < 5);

  if (!meetsLevel3) return false;

  await supabase.from("vendors").update({ verification_level: 3 }).eq("id", vendorId);
  await supabase.from("verification_activity_log").insert({
    vendor_id: vendorId,
    actor_type: "system",
    action: "level_upgraded",
    old_level: 2,
    new_level: 3,
    notes: `Level 3 auto-upgrade: ${m.completed_jobs_count} jobs, ${vendor.rating} rating, ${m.response_rate}% response`,
  });

  return true;
}

// ── Admin alert helpers ───────────────────────────────────────────────────────

export async function createAdminAlert(
  supabase: SupabaseClient,
  alert: {
    type: string;
    title: string;
    body?: string;
    vendor_id?: string;
    verification_id?: string;
    severity?: "info" | "warning" | "danger";
  }
) {
  await supabase.from("admin_alerts").insert({
    type: alert.type,
    title: alert.title,
    body: alert.body ?? null,
    vendor_id: alert.vendor_id ?? null,
    verification_id: alert.verification_id ?? null,
    severity: alert.severity ?? "info",
  });
}
