"use client";

import { useState, useRef, useEffect } from "react";
import { X, Phone, Loader2, CheckCircle2, Mail } from "lucide-react";

interface PhoneVerifyModalProps {
  phone: string;
  onVerified: () => void;
  onClose: () => void;
}

type Step = "confirm" | "enter_code" | "success";

export function PhoneVerifyModal({ phone, onVerified, onClose }: PhoneVerifyModalProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  async function sendCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone }),
      });
      const data = await res.json() as { success?: boolean; error?: string; expiresAt?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      setExpiresAt(new Date(data.expiresAt ?? Date.now() + 15 * 60 * 1000));
      setStep("enter_code");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setCode(digits.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function verifyCode() {
    const fullCode = code.join("");
    if (fullCode.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, code: fullCode }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setStep("success");
      setTimeout(() => { onVerified(); onClose(); }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  const minsLeft = Math.floor(secondsLeft / 60);
  const secsLeft = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1b3e] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Phone size={18} className="text-brand-400" />
            Verify Phone Number
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              We will send a 6-digit code to your <span className="text-white font-medium">email address</span> to confirm that you own this phone number.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
              <Phone size={14} className="text-slate-500 flex-shrink-0" />
              <span className="text-white font-medium">{phone}</span>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={sendCode} disabled={loading} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading && <Loader2 size={13} className="animate-spin" />}
                <Mail size={13} />
                Send Code
              </button>
            </div>
          </div>
        )}

        {step === "enter_code" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Enter the 6-digit code sent to your email. It expires in{" "}
              <span className="text-white font-medium">{minsLeft}:{String(secsLeft).padStart(2, "0")}</span>.
            </p>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-12 rounded-xl border border-white/15 bg-white/6 text-center text-xl font-bold text-white focus:outline-none focus:border-brand-400 transition-colors"
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button
              onClick={verifyCode}
              disabled={loading || code.join("").length !== 6}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Verify
            </button>
            <button
              onClick={() => { setStep("confirm"); setCode(["", "", "", "", "", ""]); setError(null); }}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Send a new code
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="text-white font-semibold">Phone verified!</p>
            <p className="text-sm text-slate-400 text-center">Your phone number has been successfully verified.</p>
          </div>
        )}
      </div>
    </div>
  );
}
