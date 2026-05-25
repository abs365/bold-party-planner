import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, Download } from "lucide-react";

function SuccessContent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center mx-auto shadow-2xl animate-glow">
            <CheckCircle2 size={44} className="text-white" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-brand-500/30 animate-ping" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-3">Payment Successful!</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Your payment has been confirmed and your booking is now secured.
          A confirmation email has been sent to you.
        </p>

        <div className="glass-card p-6 mb-8 text-left space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">Booking confirmed with the vendor</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">Invoice generated automatically</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">Confirmation email sent</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">Vendor has been notified</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="btn-primary flex-1 py-3">
            <Calendar size={16} />
            View My Events
          </Link>
          <Link href="/dashboard/payments" className="btn-secondary flex-1 py-3">
            <Download size={16} />
            View Invoice
          </Link>
        </div>

        <p className="text-slate-600 text-xs mt-6">
          Need help? Contact support@boldparty.co.uk
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
