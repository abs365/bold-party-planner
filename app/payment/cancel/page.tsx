import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { StatusPage } from "@/components/ui/StatusPage";

export default function PaymentCancelPage() {
  return (
    <StatusPage
      theme="dark"
      icon={<XCircle size={36} />}
      iconVariant="error"
      title="Payment Cancelled"
      description="Your payment was cancelled and no charge was made. Your booking request is still active — you can complete payment at any time."
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/bookings" className="btn-primary flex-1 py-3">
          <RefreshCw size={16} />
          Complete Payment
        </Link>
        <Link href="/dashboard" className="btn-secondary flex-1 py-3">
          <ArrowLeft size={16} />
          Go to Dashboard
        </Link>
      </div>
    </StatusPage>
  );
}
