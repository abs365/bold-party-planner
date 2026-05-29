import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, Download } from "lucide-react";

function SuccessContent() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center shadow-lg">
            <CheckCircle2 size={40} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your payment has been confirmed and your booking is now secured.
          A confirmation email has been sent to you.
        </p>

        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 text-left space-y-3">
          {[
            "Booking confirmed with the vendor",
            "Invoice generated automatically",
            "Confirmation email sent",
            "Vendor has been notified",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="btn-primary flex-1 py-3">
            <Calendar size={16} />
            View My Events
          </Link>
          <Link href="/dashboard/payments" className="btn-secondary-light flex-1 py-3">
            <Download size={16} />
            View Invoice
          </Link>
        </div>

        <p className="text-gray-400 text-xs mt-6">
          Need help? Contact support@elbold.com
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
