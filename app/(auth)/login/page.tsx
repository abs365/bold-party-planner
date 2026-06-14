"use client";

import { useState, useEffect, useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { loginAction } from "@/app/actions/login";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo  = searchParams.get("redirect") ?? "/dashboard";
  const errorParam  = searchParams.get("error");

  async function handleResendConfirmation(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) { toast.error("Enter your email address first"); return; }
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (res.ok) {
        toast.success("Confirmation email sent. Check your inbox.");
      } else {
        const d = await res.json() as { error?: string };
        toast.error(d.error ?? "Could not send email. Try again or contact support.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast.success("Password updated. Please sign in with your new password.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex">

      {/* Left panel: dark navy brand */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[42%] flex-shrink-0 px-12 relative overflow-hidden"
        style={{ background: "#0D1B3E" }}
      >
        {/* Subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,168,76,0.04) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 text-center max-w-xs">
          <Link href="/" className="inline-block mb-10">
            <span className="text-3xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
              Elbold
            </span>
          </Link>

          <h2
            className="text-2xl font-light leading-snug mb-4"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Trusted professionals for extraordinary events.
          </h2>
          <p
            className="text-sm font-light leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            The UK marketplace for verified event professionals.
          </p>

          {/* Trust pills */}
          <div className="mt-10 space-y-3">
            {[
              "Verified vendors",
              "Stripe-secured payments",
              "Full dispute protection",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 justify-center">
                <span style={{ color: "rgba(201,168,76,0.5)", fontSize: "10px" }}>&#x2605;</span>
                <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: white form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-white">

        {/* Mobile logo only */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F4D" }}>
              Elbold
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm">

          {/* Auth callback errors */}
          {(errorParam === "auth_callback_failed" || errorParam === "link_expired") && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {errorParam === "link_expired" ? "Confirmation link has expired" : "Confirmation link didn’t work"}
                  </p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    {errorParam === "link_expired"
                      ? "The link is only valid for 24 hours and can only be used once. Enter your email below to receive a fresh link."
                      : "This can happen when the link expires, has already been used, or is opened on a different device or browser than the one you signed up with."}
                  </p>
                  {errorParam !== "link_expired" && (
                    <p className="text-xs text-amber-700 mt-1">
                      If your email is already confirmed, sign in below. Otherwise request a new link.
                    </p>
                  )}
                </div>
              </div>
              <form onSubmit={handleResendConfirmation} className="px-4 pb-4 flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors disabled:opacity-60"
                >
                  {resending ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  Resend
                </button>
              </form>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1 font-light">Sign in to your account</p>
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

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
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-light">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-light pl-icon pr-10"
                  required
                  autoComplete="current-password"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-luxury-dark w-full py-3 mt-2"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              {isPending ? "Signing in..." : (
                <>Sign In <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 font-light">
            Don&apos;t have an account?{" "}
            <Link
              href={redirectTo !== "/dashboard" ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="text-gray-900 hover:opacity-70 font-semibold transition-opacity"
            >
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
