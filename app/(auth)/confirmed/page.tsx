import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Email Confirmed",
};

export default function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        {/* Success icon */}
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>

        <h1 className="text-2xl font-light text-gray-900 tracking-tight mb-3">
          Email confirmed
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Your email address has been confirmed successfully.
          Your application is currently under review.
          We will notify you once approved, usually within 2 working days.
        </p>

        {/* Status timeline */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
            What happens next
          </p>
          <div className="space-y-0">
            {[
              {
                label: "Email confirmed",
                detail: "Done. Your identity has been verified.",
                done: true,
                active: false,
              },
              {
                label: "Application under review",
                detail: "Our team is reviewing your profile and portfolio. Up to 2 working days.",
                done: false,
                active: true,
              },
              {
                label: "Decision notification",
                detail: "You will receive an email with the outcome of your application.",
                done: false,
                active: false,
              },
              {
                label: "Profile published",
                detail: "Once approved, your profile is visible to customers on Elbold.",
                done: false,
                active: false,
              },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      stage.done
                        ? "bg-emerald-50 border-emerald-400"
                        : stage.active
                        ? "bg-amber-50 border-amber-400"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {stage.done ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : stage.active ? (
                      <Clock size={13} className="text-amber-500" />
                    ) : (
                      <span className="text-xs text-gray-300 font-bold">{i + 1}</span>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`w-px h-10 mt-1 ${stage.done ? "bg-emerald-200" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className={`pb-8 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm font-medium mb-0.5 ${
                      stage.done ? "text-emerald-700" : stage.active ? "text-amber-700" : "text-gray-400"
                    }`}
                  >
                    {stage.label}
                    {stage.active && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">{stage.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/vendor/onboarding"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            View Application Status
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Questions? Email{" "}
          <a href="mailto:hello@elbold.com" className="underline hover:text-gray-600">
            hello@elbold.com
          </a>
        </p>

      </div>
    </div>
  );
}
