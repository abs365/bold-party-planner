import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState } from "@/components/ui/StateComponents";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag, Calendar, Users, Camera, ArrowRight } from "lucide-react";
import { PendingVendorBanner } from "@/components/vendor/PendingVendorBanner";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "pending_payment",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;

export default async function VendorBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, status")
    .eq("user_id", user.id)
    .single();
  if (!vendor) redirect("/vendor/apply");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, event:events(title, date, city, guest_count), customer:profiles(full_name, email, phone)"
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const allBookings = (bookings ?? []) as Booking[];

  // Resolve active filter from URL
  const { status: statusParam } = await searchParams;
  const activeStatus =
    statusParam && BOOKING_STATUSES.includes(statusParam as (typeof BOOKING_STATUSES)[number])
      ? statusParam
      : "all";

  // Filtered list for display
  const displayed =
    activeStatus === "all"
      ? allBookings
      : allBookings.filter((b) => b.status === activeStatus);

  // Build tab list — omit statuses with 0 bookings (except "all")
  const tabs = [
    { key: "all", label: "All", count: allBookings.length },
    ...BOOKING_STATUSES.filter(
      (s) => allBookings.some((b) => b.status === s)
    ).map((s) => ({
      key: s,
      label: s.replace(/_/g, " "),
      count: allBookings.filter((b) => b.status === s).length,
    })),
  ];

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {vendor.status === "pending" && <PendingVendorBanner />}

        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage all your booking requests
          </p>
        </div>

        {/* Interactive status filter — URL-based navigation */}
        <Suspense fallback={<div className="h-8" />}>
          <FilterTabs tabs={tabs} activeKey={activeStatus} />
        </Suspense>

        <div className="space-y-3">
          {displayed.length === 0 && allBookings.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={24} className="text-slate-500" />
              </div>
              <h3 className="font-bold text-white mb-2">No bookings yet</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                Bookings appear here once customers reserve your services. A
                complete profile with photos and availability set gets 4x more
                enquiries.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href="/vendor/media"
                  className="btn-primary text-sm py-2 px-4"
                >
                  <Camera size={14} /> Upload Photos
                </Link>
                <Link
                  href="/vendor/quotes"
                  className="btn-secondary text-sm py-2 px-4"
                >
                  View Leads <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : displayed.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={`No ${activeStatus.replace(/_/g, " ")} bookings`}
              description="No bookings match this filter. Try a different status."
            />
          ) : (
            displayed.map((booking) => {
              const event = booking.event as Record<string, unknown>;
              const customer = booking.customer as Record<string, unknown>;
              return (
                <Link
                  key={booking.id}
                  href={`/vendor/bookings/${booking.id}`}
                  className="bg-white/4 border border-white/6 rounded-xl p-5 flex items-center justify-between hover:border-brand-500/30 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                        {String(event?.title ?? "Event")}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {event?.date ? formatDate(String(event.date)) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {String(event?.guest_count ?? 0)} guests
                      </span>
                      <span>{String(customer?.full_name ?? "Customer")}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-white">
                      {formatCurrency(booking.total_amount)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(booking.created_at)}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
