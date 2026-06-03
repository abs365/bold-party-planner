"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import toast from "react-hot-toast";

type PassFail = "pass" | "fail" | null;

const CUSTOMER_STEPS: { key: string; label: string }[] = [
  { key: "account_creation",    label: "Account Creation" },
  { key: "email_verification",  label: "Email Verification" },
  { key: "login",               label: "Login" },
  { key: "create_event",        label: "Create Event" },
  { key: "browse_vendors",      label: "Browse Vendors" },
  { key: "request_quote",       label: "Request Quote" },
  { key: "receive_quote",       label: "Receive Quote" },
  { key: "accept_quote",        label: "Accept Quote" },
];

function PassFailToggle({
  value,
  onChange,
}: {
  value: PassFail;
  onChange: (v: PassFail) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(value === "pass" ? null : "pass")}
        className={cn(
          "px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all",
          value === "pass"
            ? "bg-green-500 border-green-500 text-white"
            : "bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600"
        )}
      >
        PASS
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "fail" ? null : "fail")}
        className={cn(
          "px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all",
          value === "fail"
            ? "bg-red-500 border-red-500 text-white"
            : "bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
        )}
      >
        FAIL
      </button>
    </div>
  );
}

export function CustomerTestForm() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState("");
  const [steps, setSteps] = useState<Record<string, PassFail>>({});
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState("");
  const [reportBug, setReportBug] = useState(false);
  const [bugTitle, setBugTitle]       = useState("");
  const [bugDesc, setBugDesc]         = useState("");
  const [bugUrl, setBugUrl]           = useState("");
  const [bugSeverity, setBugSeverity] = useState<string>("");
  const [bugScreenshot, setBugScreenshot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  function setStep(key: string, val: PassFail) {
    setSteps((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) { toast.error("Name and email are required"); return; }
    if (rating === 0) { toast.error("Please select an overall rating"); return; }
    if (reportBug && (!bugTitle || !bugDesc || !bugSeverity)) {
      toast.error("Please fill in all bug report fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pilot/testing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_type: "customer",
          tester_name: name,
          tester_email: email,
          rating,
          results: { device, steps },
          comments,
          bug: reportBug
            ? { title: bugTitle, description: bugDesc, page_url: bugUrl, severity: bugSeverity, screenshot_url: bugScreenshot }
            : null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 pb-20 flex flex-col items-center justify-center min-h-[80vh]">
          <CheckCircle2 size={64} className="text-green-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-gray-500 text-lg text-center max-w-md">
            Your customer test results have been submitted. Your feedback directly shapes the ELBOLD launch.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xs tracking-[0.3em] font-semibold mb-3 uppercase" style={{ color: "rgba(201,168,76,0.7)" }}>
            Pilot Testing
          </p>
          <h1 className="text-3xl font-light text-white mb-3">Customer Journey Test</h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Test the full customer experience and report what you find. Your results go directly to the ELBOLD launch team.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-12 space-y-8">

        {/* Tester Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Your Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className="input-light" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className="input-light" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Used</label>
            <input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="e.g. iPhone 14, MacBook, Samsung Galaxy" className="input-light" />
          </div>
        </div>

        {/* Test Steps */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Test Results</h2>
          <p className="text-sm text-gray-400 mb-5">Mark each step PASS or FAIL based on what you experienced.</p>
          <div className="space-y-3">
            {CUSTOMER_STEPS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <PassFailToggle value={steps[key] ?? null} onChange={(v) => setStep(key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Rating & Comments */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Overall Feedback</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating (1 = terrible, 10 = excellent) *</label>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-sm font-bold border transition-all",
                    rating === n
                      ? n >= 7 ? "bg-green-500 border-green-500 text-white" : n >= 4 ? "bg-amber-400 border-amber-400 text-white" : "bg-red-500 border-red-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments & Observations</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4} placeholder="What worked well? What was confusing? Any suggestions?" className="input-light resize-none" />
          </div>
        </div>

        {/* Bug Report */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Report a Bug?</h2>
              <p className="text-xs text-gray-400 mt-0.5">Found something broken? Report it here.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setReportBug(true)} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all", reportBug ? "bg-[#0D1B3E] border-[#0D1B3E] text-white" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400")}>YES</button>
              <button type="button" onClick={() => setReportBug(false)} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all", !reportBug ? "bg-gray-100 border-gray-200 text-gray-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400")}>NO</button>
            </div>
          </div>

          {reportBug && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bug Title *</label>
                <input value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} placeholder="Short description of the issue" className="input-light" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={bugDesc} onChange={(e) => setBugDesc(e.target.value)} rows={3} placeholder="Steps to reproduce, what you expected, what happened instead..." className="input-light resize-none" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page URL</label>
                  <input value={bugUrl} onChange={(e) => setBugUrl(e.target.value)} placeholder="https://www.elbold.com/..." className="input-light" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                  <div className="flex gap-2 flex-wrap">
                    {["critical","high","medium","low"].map((s) => (
                      <button key={s} type="button" onClick={() => setBugSeverity(s)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all",
                          bugSeverity === s
                            ? s === "critical" ? "bg-red-600 border-red-600 text-white"
                              : s === "high" ? "bg-orange-500 border-orange-500 text-white"
                              : s === "medium" ? "bg-amber-400 border-amber-400 text-white"
                              : "bg-blue-400 border-blue-400 text-white"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                        )}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot URL (optional)</label>
                <input value={bugScreenshot} onChange={(e) => setBugScreenshot(e.target.value)} placeholder="Link to screenshot (Imgur, Google Drive, etc.)" className="input-light" />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-luxury-dark w-full py-4 text-base">
          {submitting ? <Loader2 size={18} className="animate-spin mr-2 inline" /> : null}
          {submitting ? "Submitting..." : "Submit Test Results"}
        </button>
      </form>
      <Footer />
    </div>
  );
}
