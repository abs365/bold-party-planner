"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Star } from "lucide-react";

interface Props { type: "vendor" | "customer" }

type Rating = 1 | 2 | 3 | 4 | 5;

function StarRating({ value, onChange, label }: { value: Rating | null; onChange: (r: Rating) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-2">
      <p className="text-white/70 text-sm">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n as Rating)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${
                (hover || (value ?? 0)) >= n ? "text-yellow-400 fill-yellow-400" : "text-white/15"
              }`}
            />
          </button>
        ))}
        {value && (
          <span className="ml-2 text-white/40 text-xs self-center">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
          </span>
        )}
      </div>
    </div>
  );
}

const VENDOR_QUESTIONS: { key: string; label: string }[] = [
  { key: "q_onboarding",   label: "How easy was the onboarding process?" },
  { key: "q_verification", label: "How easy was the document verification?" },
  { key: "q_quoting",      label: "How easy is it to respond to quote requests?" },
  { key: "q_recommend",    label: "How likely are you to recommend ELBOLD to other vendors?" },
];

const CUSTOMER_QUESTIONS: { key: string; label: string }[] = [
  { key: "q_finding_vendors", label: "How easy was it to find the right vendors?" },
  { key: "q_requesting",      label: "How easy was it to request quotes?" },
  { key: "q_comparing",       label: "How easy was it to compare vendor quotes?" },
  { key: "q_trust",           label: "How much do you trust the vendor profiles on ELBOLD?" },
  { key: "q_use_again",       label: "How likely are you to use ELBOLD again?" },
];

export function FeedbackForm({ type }: Props) {
  const router  = useRouter();
  const qs      = type === "vendor" ? VENDOR_QUESTIONS : CUSTOMER_QUESTIONS;
  const [ratings, setRatings] = useState<Record<string, Rating | null>>(
    Object.fromEntries(qs.map((q) => [q.key, null]))
  );
  const [missing,    setMissing]    = useState("");
  const [comments,   setComments]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  const allRated = qs.every((q) => ratings[q.key] !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRated) { setError("Please rate all questions before submitting."); return; }
    setSubmitting(true); setError("");
    try {
      const payload: Record<string, unknown> = { type, additional_comments: comments || undefined };
      for (const q of qs) payload[q.key] = ratings[q.key];
      if (type === "vendor" && missing) payload.missing_features = missing;

      const res = await fetch("/api/pilot/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white/4 border border-emerald-500/25 rounded-xl p-10 text-center space-y-4">
        <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
        <h2 className="text-white font-bold text-lg">Thank you!</h2>
        <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
          Your feedback has been submitted. It will be reviewed by the ELBOLD team and used to improve the platform.
        </p>
        <button
          onClick={() => router.push(type === "vendor" ? "/vendor/dashboard" : "/dashboard")}
          className="btn-primary mt-2"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/4 border border-white/6 rounded-xl p-6 space-y-7">
      {qs.map((q) => (
        <StarRating
          key={q.key}
          label={q.label}
          value={ratings[q.key]}
          onChange={(r) => setRatings((prev) => ({ ...prev, [q.key]: r }))}
        />
      ))}

      {type === "vendor" && (
        <div className="space-y-2">
          <p className="text-white/70 text-sm">What features are currently missing that would help you most?</p>
          <textarea
            className="input-field resize-none text-sm"
            rows={3}
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            placeholder="e.g. calendar sync, contract templates, messaging improvements..."
            maxLength={2000}
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-white/70 text-sm">Any other comments or suggestions?</p>
        <textarea
          className="input-field resize-none text-sm"
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Share anything else on your mind..."
          maxLength={2000}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !allRated}
        className="btn-primary w-full py-3 disabled:opacity-40"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>

      <p className="text-white/20 text-xs text-center">
        Your responses are anonymous to other users and used only to improve ELBOLD.
      </p>
    </form>
  );
}
