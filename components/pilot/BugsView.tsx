"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, ExternalLink, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface BugReport {
  id: string;
  reporter_name: string;
  reporter_email: string;
  test_type: string;
  title: string;
  description: string;
  page_url: string | null;
  severity: "critical" | "high" | "medium" | "low";
  screenshot_url: string | null;
  status: string;
  created_at: string;
}

interface BugsViewProps {
  bugs: BugReport[];
}

const STATUSES = ["open", "investigating", "fixed", "verified", "closed"] as const;

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "text-red-400",    bg: "bg-red-500/15 border-red-500/25" },
  high:     { label: "High",     color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/25" },
  medium:   { label: "Medium",   color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/25" },
  low:      { label: "Low",      color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/25" },
};

const STATUS_COLOR: Record<string, string> = {
  open:          "bg-red-500/20 text-red-300",
  investigating: "bg-amber-500/20 text-amber-300",
  fixed:         "bg-blue-500/20 text-blue-300",
  verified:      "bg-green-500/20 text-green-300",
  closed:        "bg-slate-500/20 text-slate-400",
};

export function BugsView({ bugs: initialBugs }: BugsViewProps) {
  const [bugs, setBugs]               = useState<BugReport[]>(initialBugs);
  const [filterSeverity, setFilter]   = useState<string>("all");
  const [filterStatus, setFilterSt]   = useState<string>("all");
  const [search, setSearch]           = useState("");
  const [updating, setUpdating]       = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = bugs;
    if (filterSeverity !== "all") result = result.filter((b) => b.severity === filterSeverity);
    if (filterStatus !== "all")   result = result.filter((b) => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.reporter_name.toLowerCase().includes(q) || b.reporter_email.toLowerCase().includes(q));
    }
    return result;
  }, [bugs, filterSeverity, filterStatus, search]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/pilot/testing/bugs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Update failed");
      }
      setBugs((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, reporter..." className="input-field pl-9 text-sm py-2" />
        </div>

        <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl px-2 py-1.5">
          <span className="text-xs text-slate-500 self-center mr-1">Severity:</span>
          {["all","critical","high","medium","low"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors",
                filterSeverity === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-white")}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl px-2 py-1.5">
          <span className="text-xs text-slate-500 self-center mr-1">Status:</span>
          {["all","open","investigating","fixed","verified","closed"].map((s) => (
            <button key={s} onClick={() => setFilterSt(s)}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors",
                filterStatus === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-white")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500">{filtered.length} bug{filtered.length !== 1 ? "s" : ""}</div>

      {filtered.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
          <AlertTriangle size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">No bugs match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bug) => {
            const sev = SEVERITY_CONFIG[bug.severity] ?? SEVERITY_CONFIG.low;
            return (
              <div key={bug.id} className={cn("border rounded-xl p-5", sev.bg)}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", sev.bg, sev.color)}>
                        {sev.label}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLOR[bug.status] ?? STATUS_COLOR.open)}>
                        {bug.status}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">{bug.test_type} test</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{bug.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{bug.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{bug.reporter_name} ({bug.reporter_email})</span>
                      {bug.page_url && (
                        <a href={bug.page_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                          <ExternalLink size={10} /> {bug.page_url.replace("https://www.elbold.com", "")}
                        </a>
                      )}
                      {bug.screenshot_url && (
                        <a href={bug.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-white">
                          <ExternalLink size={10} /> Screenshot
                        </a>
                      )}
                      <span>{new Date(bug.created_at).toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="flex-shrink-0">
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">Update Status</label>
                    <div className="flex flex-col gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={bug.status === s || updating === bug.id}
                          onClick={() => void updateStatus(bug.id, s)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border text-left",
                            bug.status === s
                              ? cn(STATUS_COLOR[s], "border-transparent cursor-default")
                              : "bg-white/5 border-white/8 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-40"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
