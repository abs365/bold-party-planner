"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Lock } from "lucide-react";

interface BankDetails {
  account_name: string;
  sort_code: string;
  account_number: string;
}

interface BankDetailsFormProps {
  initial: BankDetails | null;
}

export function BankDetailsForm({ initial }: BankDetailsFormProps) {
  const [form, setForm] = useState<BankDetails>({
    account_name:   initial?.account_name   ?? "",
    sort_code:      initial?.sort_code      ?? "",
    account_number: initial?.account_number ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [error,  setError]    = useState("");

  const set = (k: keyof BankDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/vendor/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saved && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
          <CheckCircle2 size={15} /> Bank details saved. The Elbold team will use these for your next payout.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
          Account Name
        </label>
        <input
          className="input-field text-sm"
          value={form.account_name}
          onChange={set("account_name")}
          placeholder="e.g. James Bennett Photography"
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Sort Code
          </label>
          <input
            className="input-field text-sm font-mono"
            value={form.sort_code}
            onChange={set("sort_code")}
            placeholder="12-34-56"
            required
            pattern="\d{2}-?\d{2}-?\d{2}"
            title="Format: 12-34-56"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Account Number
          </label>
          <input
            className="input-field text-sm font-mono"
            value={form.account_number}
            onChange={set("account_number")}
            placeholder="12345678"
            required
            pattern="\d{6,8}"
            title="6–8 digits"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/3 border border-white/6 rounded-lg px-3 py-2.5">
        <Lock size={12} className="flex-shrink-0" />
        Bank details are stored securely and are only visible to the Elbold payouts team. Never shared with customers.
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary py-2.5 text-sm disabled:opacity-40"
      >
        {saving ? "Saving…" : initial ? "Update Bank Details" : "Save Bank Details"}
      </button>
    </form>
  );
}
