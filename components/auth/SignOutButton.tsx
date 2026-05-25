"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      toast.error("Sign out failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-left w-full disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={18} className="text-red-400 animate-spin" />
      ) : (
        <LogOut size={18} className="text-red-400" />
      )}
      <div>
        <div className="text-sm font-semibold text-red-400">{loading ? "Signing out..." : "Sign Out"}</div>
        <div className="text-xs text-slate-500">Sign out of your account</div>
      </div>
    </button>
  );
}
