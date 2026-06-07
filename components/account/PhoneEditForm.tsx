"use client";

import { useState, useTransition } from "react";
import { Phone, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { updateProfilePhoneAction } from "@/app/actions/profile";
import { PhoneVerifyModal } from "@/components/vendor/PhoneVerifyModal";

interface PhoneEditFormProps {
  currentPhone: string | null;
  phoneVerified: boolean;
}

export function PhoneEditForm({ currentPhone, phoneVerified: initialPhoneVerified }: PhoneEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [isVerified, setIsVerified] = useState(initialPhoneVerified);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfilePhoneAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setIsVerified(false);
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <>
        <div className="flex items-center justify-between py-3 border-b border-white/6">
          <span className="text-sm text-slate-400">Phone</span>
          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 size={11} /> Verified
              </span>
            ) : currentPhone ? (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 rounded-md px-2 py-0.5 transition-colors"
              >
                <ShieldCheck size={11} /> Verify
              </button>
            ) : null}
            <span className="text-sm font-medium text-white">
              {currentPhone ?? "Not set"}
            </span>
            <button
              onClick={() => { setEditing(true); setSuccess(false); }}
              className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors ml-2"
            >
              Edit
            </button>
          </div>
        </div>
        {showVerifyModal && currentPhone && (
          <PhoneVerifyModal
            phone={currentPhone}
            onVerified={() => setIsVerified(true)}
            onClose={() => setShowVerifyModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="py-3 border-b border-white/6">
      <form action={handleSubmit} className="flex items-center gap-2">
        <Phone size={13} className="text-slate-500 flex-shrink-0" />
        <input
          name="phone"
          type="tel"
          defaultValue={currentPhone ?? ""}
          placeholder="07700 900000"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/25"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs py-1.5 px-3 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {pending && <Loader2 size={11} className="animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setError(null); }}
          className="text-xs text-slate-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-1.5 ml-5">{error}</p>}
      {success && <p className="text-xs text-emerald-400 mt-1.5 ml-5">Phone number saved. Click Verify to confirm your number.</p>}
      <p className="text-xs text-slate-600 mt-1.5 ml-5">UK numbers only. Visible to ELBOLD admin - not shown on your public profile.</p>
    </div>
  );
}
