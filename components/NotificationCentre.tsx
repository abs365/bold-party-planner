"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, ShoppingBag, CreditCard, Star, Clock, Info } from "lucide-react";
import { usePolling, useRefreshOnFocus } from "@/lib/polling";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  booking: ShoppingBag,
  payment: CreditCard,
  review: Star,
  reminder: Clock,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  booking: "bg-blue-500/15 text-blue-400",
  payment: "bg-green-500/15 text-green-400",
  review: "bg-yellow-500/15 text-yellow-400",
  reminder: "bg-purple-500/15 text-purple-400",
  system: "bg-white/8 text-white/50",
};

export function NotificationCentre({ notifications: initial }: { notifications: NotificationItem[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [marking, setMarking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json() as NotificationItem[];
      if (Array.isArray(data)) setNotifications(data);
    } catch { /* silent */ }
  }, []);

  usePolling(refresh, 30_000);
  useRefreshOnFocus(refresh);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    setMarking(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setMarking(false);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    });
    setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
  }

  if (notifications.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-7 h-7 text-white/20" />
        </div>
        <h3 className="text-white/60 text-lg font-semibold">All caught up!</h3>
        <p className="text-white/35 text-sm mt-2 max-w-xs mx-auto">
          No notifications yet. We&apos;ll alert you about bookings, payments, new messages, and more.
        </p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/50 text-sm">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => void markAllRead()}
            disabled={marking}
            className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? Bell;
          const colorCls = TYPE_COLOR[n.type] ?? TYPE_COLOR.system;

          const Content = (
            <div
              className={cn(
                "glass-card p-4 flex gap-3 transition-all cursor-pointer hover:bg-white/4",
                !n.read && "border-l-2 border-l-brand-500 bg-brand-500/3"
              )}
              onClick={() => { if (!n.read) void markRead(n.id); }}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", colorCls)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-medium leading-snug", n.read ? "text-white/70" : "text-white")}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-white/45 text-xs mt-1 leading-relaxed">{n.message}</p>
                <p className="text-white/20 text-xs mt-1.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );

          return n.link ? (
            <Link key={n.id} href={n.link}>{Content}</Link>
          ) : (
            <div key={n.id}>{Content}</div>
          );
        })}
      </div>
    </div>
  );
}
