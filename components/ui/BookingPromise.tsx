import Link from "next/link";
import { ShieldCheck, MessageCircle, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingPromiseProps {
  vendorName?: string;
  className?: string;
  /** "quote" shows the 3-step quote flow. "booking" shows the payment promise. */
  variant?: "quote" | "booking" | "both";
}

export function BookingPromise({ vendorName, className, variant = "both" }: BookingPromiseProps) {
  return (
    <div className={cn("space-y-3", className)}>

      {/* What happens next */}
      {(variant === "quote" || variant === "both") && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            What happens when you request a quote
          </p>
          <div className="space-y-2.5">
            {[
              { n: "1", text: "Send your request — free, no payment, no commitment" },
              { n: "2", text: vendorName ? `${vendorName} reviews and responds — usually within 24 hours` : "Vendor reviews and responds — usually within 24 hours" },
              { n: "3", text: "If you're happy, confirm and pay a 30% deposit to secure your date" },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "#0B1F4D", color: "#D4AF37" }}
                >
                  {n}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment protection */}
      {(variant === "booking" || variant === "both") && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={13} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-800">Your money is protected</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: Lock,         text: "30% deposit held by Stripe — not released until your event" },
              { icon: CheckCircle2, text: "Full refund if vendor cancels" },
              { icon: MessageCircle, text: "Disputes resolved by ELBOLD within 5 working days" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <Icon size={11} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/booking-protection"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium mt-3 transition-colors"
          >
            Full booking protection details
            <span aria-hidden>&#8594;</span>
          </Link>
        </div>
      )}

      {/* Cancellation summary */}
      {(variant === "booking" || variant === "both") && (
        <p className="text-center text-xs text-gray-400">
          Cancelled 30+ days out?{" "}
          <Link href="/refunds" className="text-gray-600 hover:text-gray-900 underline transition-colors">
            Full refund policy
          </Link>
        </p>
      )}

    </div>
  );
}
