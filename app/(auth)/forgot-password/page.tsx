"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/password";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, null);

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#0D1B3E" }}>
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <span className="text-3xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>Elbold</span>
          </div>
          <div className="bg-white rounded-2xl p-10 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 font-light mb-6 leading-relaxed">
              If an account exists for that address, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <Link href="/login" className="btn-luxury-dark w-full py-3 flex items-center justify-center gap-2 text-sm">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0D1B3E" }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-[42%] flex-shrink-0 px-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,168,76,0.04) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 text-center max-w-xs">
          <Link href="/" className="inline-block mb-10">
            <span className="text-3xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>Elbold</span>
          </Link>
          <h2 className="text-2xl font-light leading-snug mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
            Regain access to your account.
          </h2>
          <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            Enter your email and we&apos;ll send a secure reset link.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-white">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F4D" }}>Elbold</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Forgot password?</h1>
            <p className="text-gray-400 text-sm mt-1 font-light">
              Enter your email and we&apos;ll send a reset link.
            </p>
          </div>

          {state?.error && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-100">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  className="input-light pl-icon"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-luxury-dark w-full py-3 mt-1"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 font-light">
            Remembered it?{" "}
            <Link href="/login" className="text-gray-900 hover:opacity-70 font-semibold transition-opacity">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
