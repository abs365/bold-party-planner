"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed or app is installed
    if (
      localStorage.getItem(DISMISSED_KEY) ||
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error navigator.standalone is iOS Safari only
      window.navigator.standalone === true
    ) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:w-80 animate-fade-in-up"
      role="dialog"
      aria-label="Install ELBOLD app"
    >
      <div
        className="rounded-2xl border border-white/10 p-4 flex items-center gap-3 shadow-xl shadow-black/40"
        style={{ background: "rgba(13, 13, 24, 0.98)" }}
      >
        <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-md shadow-brand-500/30">
          <Download size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">
            Install ELBOLD Events
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Add to your home screen for the best experience
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors px-2 py-1 rounded-lg hover:bg-brand-500/10"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded"
            aria-label="Dismiss install prompt"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
