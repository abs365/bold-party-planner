"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { updatePasswordAction } from "@/app/actions/password";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#0D1B3E" }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-[42%] flex-shrink-0 px-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,168,76,0.04) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 text-center max-w-xs">
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/elbold-mark.svg" width="80" height="80" alt="Elbold" />
          </div>
          <p className="font-bold tracking-[0.3em] text-sm mb-2" style={{ color: "#C9A84C" }}>Elbold</p>
          <p className="text-xs tracking-[0.18em] mb-10 font-light uppercase" style={{ color: "rgba(201,168,76,0.45)" }}>Events</p>
          <h2 className="text-2xl font-light leading-snug mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
            Create a new password.
          </h2>
          <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            Choose something memorable and secure. Minimum 8 characters.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-white">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/elbold-mark.svg" width="52" height="52" alt="Elbold" />
            <span className="font-bold tracking-[0.2em] text-sm" style={{ color: "#0D1B3E" }}>Elbold</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Set new password</h1>
            <p className="text-gray-400 text-sm mt-1 font-light">
              Must be at least 8 characters.
            </p>
          </div>

          {state?.error && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-100">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className="input-light pl-icon pr-10"
                  required
                  minLength={8}
                  autoFocus
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

            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  className="input-light pl-icon pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-luxury-dark w-full py-3 mt-1"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              {isPending ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 font-light">
            <Link href="/login" className="text-gray-900 hover:opacity-70 font-semibold transition-opacity">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
