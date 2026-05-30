"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-4">
          Something went wrong
        </p>
        <h1 className="text-2xl font-bold text-white mb-3">An error occurred</h1>
        <p className="text-slate-400 mb-2">
          We&apos;ve been notified and are looking into it.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono mb-8">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-secondary">Go home</Link>
        </div>
      </div>
    </div>
  );
}
