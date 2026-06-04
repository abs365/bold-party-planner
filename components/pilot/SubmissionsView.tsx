"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Download, Search, Filter, ChevronDown, ChevronUp, Bug } from "lucide-react";

interface Submission {
  id: string;
  test_type: "customer" | "vendor" | "admin";
  tester_name: string;
  tester_email: string;
  rating: number;
  results: { steps?: Record<string, string>; device?: string; category?: string };
  comments: string | null;
  critical_bugs: number;
  high_bugs: number;
  medium_bugs: number;
  low_bugs: number;
  submitted_at: string;
}

interface SubmissionsViewProps {
  submissions: Submission[];
}

type SortKey = "submitted_at" | "rating" | "tester_name" | "test_type";

export function SubmissionsView({ submissions }: SubmissionsViewProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("submitted_at");
  const [sortAsc, setSortAsc]       = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = submissions;
    if (filterType !== "all") result = result.filter((s) => s.test_type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.tester_name.toLowerCase().includes(q) || s.tester_email.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "submitted_at") cmp = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      else if (sortKey === "rating") cmp = a.rating - b.rating;
      else if (sortKey === "tester_name") cmp = a.tester_name.localeCompare(b.tester_name);
      else if (sortKey === "test_type") cmp = a.test_type.localeCompare(b.test_type);
      return sortAsc ? cmp : -cmp;
    });
  }, [submissions, filterType, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  function exportCSV() {
    const headers = ["ID","Type","Name","Email","Rating","Critical","High","Medium","Low","Comments","Submitted"];
    const rows = filtered.map((s) => [
      s.id, s.test_type, s.tester_name, s.tester_email, s.rating,
      s.critical_bugs, s.high_bugs, s.medium_bugs, s.low_bugs,
      `"${(s.comments ?? "").replace(/"/g, '""')}"`,
      new Date(s.submitted_at).toISOString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `pilot-submissions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />;
  }

  const stepPass = (steps: Record<string, string> | undefined) => {
    if (!steps) return null;
    const vals = Object.values(steps);
    if (vals.length === 0) return null;
    const count = vals.filter((v) => v === "pass").length;
    return `${count}/${vals.length}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="input-field pl-9 text-sm py-2"
          />
        </div>
        {/* Type filter */}
        <div className="flex items-center gap-1 bg-white/4 border border-white/8 rounded-xl px-2 py-1.5">
          <Filter size={13} className="text-slate-500 mr-1" />
          {["all","customer","vendor","admin"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={cn("px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors",
                filterType === t ? "bg-white/10 text-white" : "text-slate-500 hover:text-white")}>
              {t}
            </button>
          ))}
        </div>
        {/* Export */}
        <button onClick={exportCSV} className="btn-secondary text-xs py-1.5 px-4 flex items-center gap-1.5">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="text-xs text-slate-500">{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</div>

      <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-white/6 text-xs font-semibold text-slate-500">
          <button className="col-span-1 text-left hover:text-white transition-colors" onClick={() => toggleSort("test_type")}>
            Type <SortIcon k="test_type" />
          </button>
          <button className="col-span-3 text-left hover:text-white transition-colors" onClick={() => toggleSort("tester_name")}>
            Tester <SortIcon k="tester_name" />
          </button>
          <div className="col-span-3">Email</div>
          <div className="col-span-1 text-center">Steps</div>
          <button className="col-span-1 text-center hover:text-white transition-colors" onClick={() => toggleSort("rating")}>
            Rating <SortIcon k="rating" />
          </button>
          <div className="col-span-1 text-center">Bugs</div>
          <button className="col-span-2 text-right hover:text-white transition-colors" onClick={() => toggleSort("submitted_at")}>
            Submitted <SortIcon k="submitted_at" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No submissions match your filters.</div>
        ) : (
          filtered.map((s) => {
            const isOpen = expanded === s.id;
            const pass   = stepPass(s.results?.steps);
            const totalBugs = s.critical_bugs + s.high_bugs + s.medium_bugs + s.low_bugs;
            return (
              <div key={s.id} className="border-b border-white/5 last:border-0">
                <button
                  className="w-full grid grid-cols-12 gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                >
                  <div className="col-span-1">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize",
                      s.test_type === "customer" ? "bg-brand-500/20 text-brand-300" :
                      s.test_type === "vendor"   ? "bg-slate-500/20 text-slate-300" :
                      "bg-amber-500/20 text-amber-300")}>
                      {s.test_type.slice(0,3)}
                    </span>
                  </div>
                  <div className="col-span-3 text-sm text-white font-medium truncate">{s.tester_name}</div>
                  <div className="col-span-3 text-xs text-slate-400 truncate">{s.tester_email}</div>
                  <div className="col-span-1 text-center text-xs text-slate-400">{pass ?? "—"}</div>
                  <div className={cn("col-span-1 text-center text-sm font-bold",
                    s.rating >= 7 ? "text-green-400" : s.rating >= 4 ? "text-amber-400" : "text-red-400")}>
                    {s.rating}/10
                  </div>
                  <div className="col-span-1 text-center">
                    {totalBugs > 0 && (
                      <span className="text-xs text-red-400 flex items-center justify-center gap-0.5">
                        <Bug size={10} /> {totalBugs}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right text-xs text-slate-500">
                    {new Date(s.submitted_at).toLocaleDateString("en-GB")}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 bg-white/2 border-t border-white/5">
                    <div className="grid sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Test Steps</h4>
                        {s.results?.steps ? (
                          <div className="space-y-1">
                            {Object.entries(s.results.steps).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}</span>
                                <span className={cn("font-semibold uppercase", v === "pass" ? "text-green-400" : "text-red-400")}>{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-slate-500">No step data</span>}
                      </div>
                      <div className="space-y-3">
                        {(s.results?.device || s.results?.category) && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Details</h4>
                            {s.results.device && <div className="text-xs text-slate-300">Device: {s.results.device}</div>}
                            {s.results.category && <div className="text-xs text-slate-300">Category: {s.results.category}</div>}
                          </div>
                        )}
                        {s.comments && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Comments</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">{s.comments}</p>
                          </div>
                        )}
                        {totalBugs > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bugs Reported</h4>
                            <div className="flex gap-2 text-xs">
                              {s.critical_bugs > 0 && <span className="text-red-400">Critical: {s.critical_bugs}</span>}
                              {s.high_bugs > 0 && <span className="text-orange-400">High: {s.high_bugs}</span>}
                              {s.medium_bugs > 0 && <span className="text-amber-400">Medium: {s.medium_bugs}</span>}
                              {s.low_bugs > 0 && <span className="text-blue-400">Low: {s.low_bugs}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
