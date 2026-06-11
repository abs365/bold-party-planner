import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Calendar, ArrowRight, Building2 } from "lucide-react";

type BookingSummary = {
  id: string;
  total_amount: number;
  deposit_amount: number;
  payment_status: string;
  vendor: { business_name: string } | null;
  event: { title: string; date: string } | null;
};

async function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let booking: BookingSummary | null = null;

  if (user && bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("id, total_amount, deposit_amount, payment_status, vendor:vendors(business_name), event:events(title, date)")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .maybeSingle();
    booking = data as BookingSummary | null;
  }

  const vendor = booking?.vendor as { business_name: string } | null;
  const event = booking?.event as { title: string; date: string } | null;
  const isDeposit = booking?.payment_status === "deposit_paid";
  const amount = booking
    ? isDeposit
      ? booking.deposit_amount
      : booking.total_amount
    : null;

  const formattedDate = event?.date
    ? new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="relative mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center shadow-lg">
            <CheckCircle2 size={40} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {booking
            ? "Your payment is confirmed and your booking is secured. A confirmation email has been sent to you."
            : "Your payment has been received. A confirmation email has been sent to you."}
        </p>

        {/* Booking summary — shown when booking data is available */}
        {booking && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6 text-left space-y-3">
            {vendor && (
              <div className="flex items-start gap-3">
                <Building2 size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Vendor</p>
                  <p className="text-sm font-semibold text-gray-900">{vendor.business_name}</p>
                </div>
              </div>
            )}
            {event && (
              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Event</p>
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                  {formattedDate && (
                    <p className="text-xs text-gray-500">{formattedDate}</p>
                  )}
                </div>
              </div>
            )}
            {amount != null && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{isDeposit ? "Deposit paid" : "Amount paid"}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 text-left space-y-3">
          {[
            "Booking confirmed with the vendor",
            "Confirmation email sent",
            "Vendor has been notified",
            "Deposit secured through Stripe, managed by Elbold",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {booking ? (
            <>
              <Link
                href={`/dashboard/bookings/${booking.id}`}
                className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                View Booking
              </Link>
              <Link href="/dashboard" className="btn-secondary-light flex-1 py-3 inline-flex items-center justify-center gap-2">
                My Dashboard
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2">
              <Calendar size={16} />
              View My Events
            </Link>
          )}
        </div>

        <p className="text-gray-400 text-xs mt-6">
          Need help? Contact{" "}
          <a href="mailto:support@elbold.com" className="underline">
            support@elbold.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string; session_id?: string }>;
}) {
  const { booking_id } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading your booking...</div>
        </div>
      }
    >
      <BookingConfirmation bookingId={booking_id ?? ""} />
    </Suspense>
  );
}
