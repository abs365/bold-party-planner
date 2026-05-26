"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, User, Store, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Role = "customer" | "vendor";

export default function SignupPage() {
  const [role, setRole] = useState<Role>("customer");
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
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;

      if (data.session) {
        toast.success("Account created! Welcome to Bold Party.");
        window.location.href = role === "vendor" ? "/vendor/apply" : "/dashboard";
        return;
      }

      setConfirmed(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already")) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
              <Mail size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-500 text-sm mb-2">We sent a confirmation link to</p>
            <p className="text-brand-600 font-semibold mb-6">{email}</p>
            <div className="space-y-3 text-left mb-6">
              {[
                "Open the email from Bold Party",
                "Click the confirmation link",
                "You'll be automatically signed in",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setConfirmed(false)}
                className="text-brand-600 hover:text-brand-700 underline"
              >
                try a different email
              </button>
            </p>
            <Link href="/login" className="btn-secondary-light w-full">
              Back to Sign In <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const strength = Math.min(4, Math.floor(password.length / 3) + ((/[A-Z]/.test(password) ? 1 : 0) + (/[0-9!@#$%^&*]/.test(password) ? 1 : 0)));

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl mb-6">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="gradient-brand-text">Bold Party</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands planning better events</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {/* Role Toggle */}
          <div className="flex gap-3 mb-6">
            {(["customer", "vendor"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
                  role === r
                    ? "gradient-brand text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                )}
              >
                {r === "customer" ? <User size={16} /> : <Store size={16} />}
                {r === "customer" ? "Book Vendors" : "Join as a Vendor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="input-light pl-icon"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input-light pl-icon"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-light pl-icon pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn("flex-1 h-1 rounded-full transition-all", {
                          "bg-red-500": strength >= level && strength <= 1,
                          "bg-amber-500": strength >= level && strength === 2,
                          "bg-yellow-400": strength >= level && strength === 3,
                          "bg-emerald-500": strength >= level && strength >= 4,
                          "bg-gray-200": strength < level,
                        })}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {password.length < 8 ? "Too short" : password.length < 10 ? "Weak, try adding numbers or symbols" : password.length < 14 ? "Good password" : "Strong password"}
                  </p>
                </div>
              )}
            </div>

            {role === "vendor" && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-blue-500" />
                After confirming your email, you&apos;ll complete your vendor profile. Free to join and you keep 90% of every booking.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Creating account..." : role === "vendor" ? "Create Vendor Account" : "Create Free Account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link> and{" "}
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
