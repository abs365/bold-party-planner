"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "vendor" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!role) return;
    setLoading(true);
    try {
      await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.push(role === "vendor" ? "/vendor/apply" : "/dashboard");
    } catch {
      // Silently redirect — set-role is best-effort
      router.push(role === "vendor" ? "/vendor/apply" : "/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: "#0D1B3E" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/elbold-mark.svg" width="56" height="56" alt="ELBOLD" className="mx-auto mb-4" />
          <h1 className="text-2xl font-light text-white mb-2">Welcome to ELBOLD</h1>
          <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.45)" }}>
            How are you using ELBOLD?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {([
            { id: "customer" as const, icon: Users, title: "I'm planning an event", desc: "Book verified vendors for weddings, birthdays, and corporate events" },
            { id: "vendor" as const, icon: Store, title: "I offer event services", desc: "List your business and receive enquiries from customers" },
          ]).map(({ id, icon: Icon, title, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all",
                role === id
                  ? "border-[#C9A84C] bg-white/6"
                  : "border-white/10 bg-white/3 hover:border-white/20"
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: role === id ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)" }}
              >
                <Icon size={18} style={{ color: role === id ? "#C9A84C" : "rgba(255,255,255,0.4)" }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-xs font-light mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!role || loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: "#C9A84C", color: "#0D1B3E" }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Setting up..." : "Continue"}
        </button>

        <p className="text-center text-xs mt-4 font-light" style={{ color: "rgba(255,255,255,0.3)" }}>
          You can change this later.{" "}
          <Link href="/login" className="underline hover:opacity-70" style={{ color: "rgba(255,255,255,0.5)" }}>
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
