"use client";

import { useEffect, useState, useCallback } from "react";
import { History, UserPlus, ArrowRightLeft, Clock, CalendarX, BellRing, Archive, ArchiveRestore } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { ManualContactActivityType } from "@/types";

interface ActivityEntry {
  id: string;
  event_type: ManualContactActivityType;
  description: string;
  actor: "vendor" | "system";
  created_at: string;
}

const EVENT_ICON: Record<ManualContactActivityType, typeof History> = {
  created: UserPlus,
  stage_changed: ArrowRightLeft,
  follow_up_set: Clock,
  follow_up_cleared: CalendarX,
  follow_up_reminder_sent: BellRing,
  archived: Archive,
  restored: ArchiveRestore,
};

export function ContactTimeline({ contactId }: { contactId: string }) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/vendor/contacts/${contactId}/activity`);
    if (res.ok) {
      const json = await res.json() as { activity: ActivityEntry[] };
      setActivity(json.activity);
    }
    setLoading(false);
  }, [contactId]);

  useEffect(() => { void load(); }, [load]);

  // PipelineControls/ContactDetailClient dispatch this after a successful save
  // so the timeline reflects new activity without a full page reload.
  useEffect(() => {
    const handler = () => void load();
    window.addEventListener("contact-activity-updated", handler);
    return () => window.removeEventListener("contact-activity-updated", handler);
  }, [load]);

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-brand-400" />
        Timeline
      </h3>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-white/3 rounded-lg animate-pulse" />)}
        </div>
      ) : activity.length === 0 ? (
        <p className="text-white/30 text-xs text-center py-3">No activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {activity.map((a) => {
            const Icon = EVENT_ICON[a.event_type] ?? History;
            return (
              <li key={a.id} className="flex gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  a.actor === "system" ? "bg-blue-500/10 text-blue-400" : "bg-white/8 text-white/50"
                }`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/80 text-sm leading-snug">{a.description}</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    {formatDateTime(a.created_at)}
                    {a.actor === "system" && <span className="text-blue-400/70"> · automated</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
