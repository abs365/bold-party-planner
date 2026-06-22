import { redirect } from "next/navigation";
import Link from "next/link";
import { BookUser } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerListView, type CustomerRow } from "@/components/vendor/CustomerListView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorCustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  // Fetch all activity for this vendor in three parallel queries.
  // Vendor isolation is enforced by .eq("vendor_id", vendor.id) and by RLS.
  const [bookingsRes, quotesRes, contactsCountRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, customer_id, status, total_amount, vendor_payout, created_at, updated_at")
      .eq("vendor_id", vendor.id),
    supabase
      .from("quotes")
      .select("id, customer_id, status, created_at")
      .eq("vendor_id", vendor.id),
    supabase
      .from("manual_contacts")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .eq("is_archived", false),
  ]);

  const directContactsCount = contactsCountRes.count ?? 0;

  const allBookings = bookingsRes.data ?? [];
  const allQuotes   = quotesRes.data ?? [];

  // Build the unique set of customer IDs across both sources
  const customerIdSet = new Set<string>([
    ...allBookings.map((b) => b.customer_id).filter(Boolean),
    ...allQuotes.map((q) => q.customer_id).filter(Boolean),
  ]);
  const customerIds = [...customerIdSet] as string[];

  let customers: CustomerRow[] = [];

  if (customerIds.length > 0) {
    // profiles_interaction_network RLS (migration 027) already restricts this to
    // profiles reachable via this vendor's bookings, quotes, and message threads.
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", customerIds);

    customers = (profiles ?? []).map((p) => {
      const cBookings = allBookings.filter((b) => b.customer_id === p.id);
      const cQuotes   = allQuotes.filter((q) => q.customer_id === p.id);

      const totalSpend = cBookings
        .filter((b) => ["confirmed", "accepted", "completed"].includes(b.status))
        .reduce((s, b) => s + (Number(b.vendor_payout ?? 0) || Number(b.total_amount ?? 0) * 0.9), 0);

      const allDates = [
        ...cBookings.map((b) => b.created_at),
        ...cQuotes.map((q) => q.created_at),
      ].filter(Boolean).sort();

      const latestBooking = [...cBookings].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )[0];

      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
        booking_count: cBookings.length,
        quote_count: cQuotes.length,
        total_spend: Math.round(totalSpend * 100) / 100,
        first_contact: allDates[0] ?? null,
        last_interaction: allDates[allDates.length - 1] ?? null,
        latest_booking_status: latestBooking?.status ?? null,
        latest_booking_id: latestBooking?.id ?? null,
      } satisfies CustomerRow;
    });

    // Sort: most recently interacted first
    customers.sort((a, b) =>
      (b.last_interaction ?? "").localeCompare(a.last_interaction ?? "")
    );
  }

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Direct Contacts summary card */}
        {directContactsCount > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <BookUser className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {directContactsCount} direct contact{directContactsCount !== 1 ? "s" : ""}
                </p>
                <p className="text-white/40 text-xs">From Instagram, WhatsApp, referrals, and other channels</p>
              </div>
            </div>
            <Link
              href="/vendor/contacts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors flex-shrink-0"
            >
              Manage Contacts →
            </Link>
          </div>
        )}
        <CustomerListView customers={customers} />
      </div>
    </DashboardLayout>
  );
}
