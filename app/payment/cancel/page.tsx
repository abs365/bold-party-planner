import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <XCircle size={36} className="text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Payment Cancelled</h1>
        <p className="text-slate-400 mb-8">
          Your payment was cancelled and no charge was made. Your booking request is still active — you can try again.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/bookings" className="btn-primary flex-1 py-3">
            <RefreshCw size={16} />
            Try Again
          </Link>
          <Link href="/dashboard" className="btn-secondary flex-1 py-3">
            <ArrowLeft size={16} />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
