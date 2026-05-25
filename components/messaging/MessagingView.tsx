"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ChevronRight } from "lucide-react";
import { MessageThread } from "./MessageThread";
import { usePolling, useRefreshOnFocus } from "@/lib/polling";
import { cn } from "@/lib/utils";

interface ThreadMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_by_customer: boolean;
  read_by_vendor: boolean;
}

interface Thread {
  id: string;
  customer_id: string;
  vendor_id: string;
  subject: string | null;
  last_message_at: string;
  customer: { id: string; full_name: string | null; avatar_url: string | null } | null;
  vendor: { id: string; business_name: string } | null;
  messages: ThreadMessage[] | null;
}

interface MessagingViewProps {
  threads: unknown[];
  currentUserId: string;
  initialThreadId?: string;
  isVendor: boolean;
}

export function MessagingView({ threads: rawThreads, currentUserId, initialThreadId, isVendor }: MessagingViewProps) {
  const [threads, setThreads] = useState<Thread[]>(rawThreads as Thread[]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = await res.json() as Thread[];
      if (Array.isArray(data)) setThreads(data);
    } catch { /* silent */ }
  }, []);

  usePolling(refresh, 15_000);
  useRefreshOnFocus(refresh);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  function getOtherPartyName(thread: Thread) {
    return isVendor
      ? (thread.customer?.full_name ?? "Customer")
      : (thread.vendor?.business_name ?? "Vendor");
  }

  function getLastMessage(thread: Thread) {
    const msgs = thread.messages;
    if (!msgs || msgs.length === 0) return "No messages yet";
    const last = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return last.content.slice(0, 60) + (last.content.length > 60 ? "..." : "");
  }

  function getUnreadCount(thread: Thread) {
    if (!thread.messages) return 0;
    return thread.messages.filter((m) => {
      if (m.sender_id === currentUserId) return false;
      return isVendor ? !m.read_by_vendor : !m.read_by_customer;
    }).length;
  }

  if (threads.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/60 text-lg">No messages yet</h3>
        <p className="text-white/40 text-sm mt-1">
          {isVendor
            ? "Messages from customers about quotes and bookings will appear here"
            : "Start a conversation with a vendor from their profile page"}
        </p>
      </div>
    );
  }

  const totalUnread = threads.reduce((sum, t) => sum + getUnreadCount(t), 0);

  return (
    <div className="glass-card overflow-hidden" style={{ height: "600px" }}>
      <div className="flex h-full">
        {/* Thread list */}
        <div className={cn(
          "border-r border-white/10 flex-shrink-0 overflow-y-auto flex flex-col",
          activeThreadId ? "hidden md:flex w-72" : "flex w-full md:w-72"
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold text-white">Messages</h3>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs font-bold">
                {totalUnread}
              </span>
            )}
          </div>

          {/* Thread items */}
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const unreadCount = getUnreadCount(thread);
              const initials = getOtherPartyName(thread)[0]?.toUpperCase() ?? "?";

              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors w-full",
                    isActive && "bg-white/8 border-l-2 border-l-brand-500"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-white font-semibold text-sm">
                      {initials}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn("text-sm font-medium truncate", unreadCount > 0 ? "text-white" : "text-white/70")}>
                        {getOtherPartyName(thread)}
                      </p>
                      <span className="text-white/25 text-xs flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: false })}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate", unreadCount > 0 ? "text-white/60" : "text-white/35")}>
                      {getLastMessage(thread)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-1 hidden md:block" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Message thread */}
        <div className={cn("flex-1 min-w-0", !activeThreadId && "hidden md:flex md:items-center md:justify-center")}>
          {activeThread ? (
            <MessageThread
              threadId={activeThread.id}
              currentUserId={currentUserId}
              otherPartyName={getOtherPartyName(activeThread)}
              onBack={() => setActiveThreadId(null)}
            />
          ) : (
            <div className="text-center text-white/25 p-8">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-white/10" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
