"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Store, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Role = "customer" | "vendor";

export default function SignupPage() {
  const [role, setRole] = useState<Role>(() => {
    if (typeof window === "undefined") return "customer";
    const params = new URLSearchParams(window.location.search);
    return params.get("role") === "vendor" ? "vendor" : "customer";
  });

  const getRedirectTo = () => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("redirect");
  };
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        }),
      });
      const json = await res.json() as { error?: string; hasSession?: boolean };

      // 409 = email already registered (caught at API level via identities check)
      if (res.status === 409) {
        toast.error(json.error ?? "An account already exists with this email. Please sign in or reset your password.");
        return;
      }

      if (!res.ok) throw new Error(json.error ?? "Signup failed");

      if (json.hasSession) {
        toast.success("Account created! Welcome to Elbold.");
        const redirectTo = getRedirectTo();
        window.location.href = redirectTo ?? (role === "vendor" ? "/vendor/apply" : "/dashboard");
        return;
      }

      setConfirmed(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already") || msg.toLowerCase().includes("already exists")) {
        toast.error("An account already exists with this email. Please sign in or reset your password.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#0D1B3E" }}>
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/elbold-mark.svg" width="64" height="64" alt="Elbold" />
          </div>
          <div className="bg-white rounded-2xl p-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <Mail size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-light text-gray-900 mb-2 tracking-tight">Check Your Email</h2>
            <p className="text-gray-400 text-sm mb-1 font-light">We sent a confirmation link to</p>
            <p className="font-semibold text-gray-900 mb-6 text-sm">{email}</p>
            <div className="space-y-3 text-left mb-6">
              {[
                "Open the email from Elbold",
                "Click the confirmation link",
                "You will be automatically signed in",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600 font-light">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(13,27,62,0.06)", border: "1px solid rgba(13,27,62,0.12)", color: "#0D1B3E" }}
                  >
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-4 font-light">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setConfirmed(false)}
                className="text-gray-900 underline hover:opacity-70"
              >
                try a different email
              </button>
            </p>
            <Link href="/login" className="btn-secondary-light w-full text-sm py-3">
              Back to Sign In <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const strength = Math.min(4, Math.floor(password.length / 3) + ((/[A-Z]/.test(password) ? 1 : 0) + (/[0-9!@#$%^&*]/.test(password) ? 1 : 0)));

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[42%] flex-shrink-0 px-12 relative overflow-hidden"
        style={{ background: "#0D1B3E" }}
      >
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
          <p
            className="text-xs tracking-[0.18em] mb-10 font-light uppercase"
            style={{ color: "rgba(201,168,76,0.45)" }}
          >
            Events
          </p>
          <h2 className="text-2xl font-light leading-snug mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
            {role === "vendor"
              ? "Grow your bookings with trusted clients."
              : "Find vendors for your extraordinary celebration."}
          </h2>
          <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            {role === "vendor"
              ? "List free. Receive verified enquiries. Build your reputation on Elbold."
              : "Verified DJs, photographers, caterers, decorators and 15 more categories across the UK."}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-white overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/elbold-mark.svg" width="52" height="52" alt="Elbold" />
            <span className="font-bold tracking-[0.2em] text-sm" style={{ color: "#0D1B3E" }}>Elbold</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-gray-400 text-sm mt-1 font-light">Join trusted vendors and event hosts across the UK</p>
          </div>

          {/* Role toggle */}
          <div className="flex gap-2 mb-7 p-1 rounded-xl bg-gray-100 border border-gray-200">
            {(["customer", "vendor"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  role === r
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {r === "customer" ? <User size={14} /> : <Store size={14} />}
                {r === "customer" ? "Book Vendors" : "Join as Vendor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="input-light pl-icon"
                  required
                  data-testid="name-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input-light pl-icon"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-light pl-icon pr-10"
                  required
                  minLength={8}
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
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn("flex-1 h-0.5 rounded-full transition-all", {
                          "bg-red-400": strength >= level && strength <= 1,
                          "bg-amber-400": strength >= level && strength === 2,
                          "bg-yellow-400": strength >= level && strength === 3,
                          "bg-emerald-500": strength >= level && strength >= 4,
                          "bg-gray-200": strength < level,
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {role === "vendor" && (
              <div
                className="p-3 rounded-xl text-xs flex items-start gap-2 font-light"
                style={{ background: "rgba(13,27,62,0.04)", border: "1px solid rgba(13,27,62,0.1)", color: "#374151" }}
              >
                <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-gray-400" />
                Free to list. Complete your vendor profile after confirming your email to start receiving enquiries.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-luxury-dark w-full py-3 mt-1">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? "Creating account..." : role === "vendor" ? "Create Vendor Account" : "Create Free Account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5 font-light">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link> and{" "}
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-gray-400 mt-3 font-light">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 hover:opacity-70 font-semibold transition-opacity">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
