"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationIndicator } from "@/components/ui/NotificationIndicator";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications/count")
      .then((r) => r.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === "number") setUnreadCount(data.count);
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative p-2 rounded-lg hover:bg-white/5"
      aria-label={
        unreadCount > 0
          ? `Notifications — ${unreadCount} unread`
          : "Notifications"
      }
    >
      <Bell size={17} className="text-slate-400" />
      <NotificationIndicator count={unreadCount} />
    </Link>
  );
}
