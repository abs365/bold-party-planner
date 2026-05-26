"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockedDate {
  date: string;
  is_available: boolean;
  notes?: string | null;
}

export function AvailabilityCalendar({ vendorId }: { vendorId?: string }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const isOwner = !vendorId;

  useEffect(() => {
    const url = isOwner
      ? `/api/vendor/availability?month=${currentMonth}`
      : `/api/vendor/availability?vendor_id=${vendorId}&month=${currentMonth}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: unknown) => {
        setBlockedDates(Array.isArray(data) ? (data as BlockedDate[]) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentMonth, vendorId, isOwner]);

  const [year, month] = currentMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const calDays: (number | null)[] = [
    ...Array(firstDay === 0 ? 6 : firstDay - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getDateStr(day: number) {
    return `${currentMonth}-${String(day).padStart(2, "0")}`;
  }

  function isBlocked(day: number) {
    return blockedDates.some((b) => b.date === getDateStr(day) && !b.is_available);
  }

  function isPast(day: number) {
    return getDateStr(day) < today;
  }

  async function toggleDate(day: number) {
    if (!isOwner || isPast(day)) return;
    const dateStr = getDateStr(day);
    const blocked = isBlocked(day);

    setSaving(dateStr);
    try {
      if (blocked) {
        await fetch("/api/vendor/availability", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr }),
        });
        setBlockedDates((d) => d.filter((b) => b.date !== dateStr));
      } else {
        setSelectedDate(dateStr);
      }
    } catch { /* empty */ }
    setSaving(null);
  }

  async function confirmBlock() {
    if (!selectedDate) return;
    setSaving(selectedDate);
    const res = await fetch("/api/vendor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, is_available: false, reason }),
    });
    const data = await res.json() as BlockedDate;
    setBlockedDates((d) => [...d.filter((b) => b.date !== selectedDate), data]);
    setSelectedDate(null);
    setReason("");
    setSaving(null);
  }

  function prevMonth() {
    const d = new Date(year, month - 2);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const d = new Date(year, month);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthName = new Date(year, month - 1).toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
        <h3 className="text-white font-semibold">{monthName}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-white/30 text-xs py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = getDateStr(day);
            const blocked = isBlocked(day);
            const past = isPast(day);
            const isSaving = saving === dateStr;
            const isToday = dateStr === today;
            return (
              <button
                key={day}
                onClick={() => void toggleDate(day)}
                disabled={past || isSaving || !isOwner}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors relative",
                  past ? "text-white/20 cursor-default" :
                  blocked ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30" :
                  isToday ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" :
                  isOwner ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-white/70",
                )}
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : day}
                {blocked && !isSaving && <X className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 text-red-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        <LegendItem color="bg-white/10" label="Available" />
        <LegendItem color="bg-red-500/20 border border-red-500/30" label="Blocked" />
        <LegendItem color="bg-brand-500/20 border border-brand-500/30" label="Today" />
      </div>

      {isOwner && <p className="text-white/30 text-xs mt-3">Click a future date to block or unblock it.</p>}

      {/* Block reason modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white/4 border border-white/6 rounded-xl p-5 w-full max-w-sm">
            <h4 className="text-white font-semibold mb-3">Block {selectedDate}?</h4>
            <input
              className="input-field mb-3"
              placeholder="Reason (optional, e.g. Holiday, Private event)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => void confirmBlock()} disabled={!!saving} className="btn-primary flex items-center gap-2 disabled:opacity-40">
                <Check className="w-4 h-4" /> Confirm Block
              </button>
              <button onClick={() => setSelectedDate(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-white/50">
      <div className={`w-3 h-3 rounded ${color}`} />
      {label}
    </div>
  );
}
