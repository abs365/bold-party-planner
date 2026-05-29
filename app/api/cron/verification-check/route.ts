import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  updateVendorMetrics,
  tryUpgradeLevel1,
  tryUpgradeLevel3,
  createAdminAlert,
} from "@/lib/verification-automation";
import { sendLevelUpgraded, sendVerificationExpiryReminder } from "@/lib/resend/verification-emails";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const results = {
    metricsUpdated: 0,
    level1Upgraded: 0,
    level3Upgraded: 0,
    expiryAlertsCreated: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  // 1. Get all approved vendors
  const { data: vendors, error: vendorErr } = await supabase
    .from("vendors")
    .select("id, user_id, verification_level, rating")
    .eq("status", "approved");

  if (vendorErr) {
    return NextResponse.json({ error: vendorErr.message }, { status: 500 });
  }

  for (const vendor of vendors ?? []) {
    try {
      // 2. Update metrics
      const metrics = await updateVendorMetrics(vendor.id, supabase);
      results.metricsUpdated++;

      // 3. Try Level 1 auto-upgrade
      if (vendor.verification_level === 0) {
        const upgraded = await tryUpgradeLevel1(vendor.id, vendor.user_id, supabase);
        if (upgraded) {
          results.level1Upgraded++;
          // Send email
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", vendor.user_id)
            .single();
          if (profile?.email) {
            await sendLevelUpgraded(profile.email, profile.full_name ?? "Vendor", 1);
            results.emailsSent++;
          }
          await createAdminAlert(supabase, {
            type: "level_upgraded",
            title: "Vendor auto-upgraded to Level 1",
            vendor_id: vendor.id,
            severity: "info",
          });
        }
      }

      // 4. Try Level 3 auto-upgrade (Level 2 vendors only)
      if (vendor.verification_level === 2) {
        const upgraded = await tryUpgradeLevel3(vendor.id, supabase, metrics);
        if (upgraded) {
          results.level3Upgraded++;
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", vendor.user_id)
            .single();
          if (profile?.email) {
            await sendLevelUpgraded(profile.email, profile.full_name ?? "Vendor", 3);
            results.emailsSent++;
          }
          await createAdminAlert(supabase, {
            type: "level_upgraded",
            title: "Vendor auto-upgraded to Level 3 (Trusted Pro)",
            vendor_id: vendor.id,
            severity: "info",
          });
        }
      }
    } catch (err) {
      results.errors.push(`vendor ${vendor.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // 5. Check for expiring verifications (30 days or 7 days)
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: expiringVerifs } = await supabase
    .from("vendor_verifications")
    .select(`
      id, type, expires_at,
      vendor:vendors(id, user_id,
        profile:profiles(email, full_name)
      )
    `)
    .eq("status", "approved")
    .not("expires_at", "is", null)
    .lte("expires_at", in30days)
    .gte("expires_at", now);

  for (const verif of expiringVerifs ?? []) {
    try {
      const expiresAt = new Date(verif.expires_at as string);
      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const vendor = verif.vendor as unknown as { id: string; profile: { email: string; full_name: string | null } | null } | null;

      // Only alert at 30-day and 7-day marks (avoid daily spam)
      if (daysLeft !== 30 && daysLeft !== 7) continue;

      const email = vendor?.profile?.email;
      const name = vendor?.profile?.full_name ?? "Vendor";

      if (email) {
        await sendVerificationExpiryReminder(email, name, verif.type as string, daysLeft);
        results.emailsSent++;
      }

      await createAdminAlert(supabase, {
        type: "verification_expiring",
        title: `Verification expiring in ${daysLeft} days`,
        body: `${verif.type} document expires in ${daysLeft} days`,
        vendor_id: vendor?.id,
        verification_id: verif.id,
        severity: daysLeft <= 7 ? "warning" : "info",
      });
      results.expiryAlertsCreated++;
    } catch (err) {
      results.errors.push(`expiry check ${verif.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...results,
  });
}
