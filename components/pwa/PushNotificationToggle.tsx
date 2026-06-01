"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2, BellRing } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";

type Status = "loading" | "unsupported" | "blocked" | "subscribed" | "unsubscribed";

export function PushNotificationToggle() {
  const [status, setStatus]   = useState<Status>("loading");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    // Check if VAPID key is present in this build
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setStatus("unsupported");
      return;
    }

    // Check current permission + subscription state
    const perm = Notification.permission;
    if (perm === "denied") {
      setStatus("blocked");
      return;
    }

    isPushSubscribed()
      .then((subscribed) => setStatus(subscribed ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsubscribed"));
  }, []);

  async function handleEnable() {
    setWorking(true);
    setMessage("");
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setStatus("subscribed");
        setMessage("Push notifications enabled. You will receive alerts even when the app is closed.");
      } else if (Notification.permission === "denied") {
        setStatus("blocked");
        setMessage("Notifications blocked in browser settings. Allow them and try again.");
      } else {
        setMessage("Could not enable notifications. Please try again.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function handleDisable() {
    setWorking(true);
    setMessage("");
    try {
      await unsubscribeFromPush();
      setStatus("unsubscribed");
      setMessage("Push notifications disabled.");
    } catch {
      setMessage("Could not disable notifications. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  // ── Unsupported ──────────────────────────────────────────────────────────
  if (status === "unsupported") {
    return (
      <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center gap-3">
        <BellOff size={18} className="text-white/20 flex-shrink-0" />
        <div>
          <p className="text-white/50 text-sm font-medium">Push notifications unavailable</p>
          <p className="text-white/30 text-xs mt-0.5">
            Your browser does not support push notifications, or the feature is not enabled on this build.
          </p>
        </div>
      </div>
    );
  }

  // ── Blocked by browser ────────────────────────────────────────────────────
  if (status === "blocked") {
    return (
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-white/70 text-sm font-medium">Notifications blocked</p>
          <p className="text-white/40 text-xs mt-0.5">
            You have blocked notifications in your browser. To re-enable, open your browser site
            settings and allow notifications for this site.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center gap-3">
        <Loader2 size={18} className="text-white/30 animate-spin flex-shrink-0" />
        <p className="text-white/40 text-sm">Checking notification status...</p>
      </div>
    );
  }

  // ── Subscribed / Unsubscribed ─────────────────────────────────────────────
  const isSubscribed = status === "subscribed";

  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        isSubscribed
          ? "bg-brand-500/8 border-brand-500/25"
          : "bg-white/4 border-white/6"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isSubscribed ? "bg-brand-500/20" : "bg-white/6"
            }`}
          >
            {isSubscribed
              ? <BellRing size={18} className="text-brand-400" />
              : <Bell size={18} className="text-white/40" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">
              {isSubscribed ? "Push notifications on" : "Push notifications off"}
            </p>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
              {isSubscribed
                ? "You will receive alerts for new quotes, bookings, and messages even when the app is closed."
                : "Enable to receive alerts for new quotes, bookings, and messages even when the app is closed."}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={isSubscribed ? handleDisable : handleEnable}
          disabled={working}
          aria-label={isSubscribed ? "Disable push notifications" : "Enable push notifications"}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 ${
            isSubscribed ? "bg-brand-500" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isSubscribed ? "translate-x-6" : "translate-x-1"
            } ${working ? "opacity-60" : ""}`}
          />
          {working && (
            <Loader2 size={10} className="absolute right-1 text-white/60 animate-spin" />
          )}
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
            status === "subscribed"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-white/5 border border-white/10 text-white/50"
          }`}
        >
          {status === "subscribed"
            ? <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
            : <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          }
          {message}
        </div>
      )}
    </div>
  );
}
