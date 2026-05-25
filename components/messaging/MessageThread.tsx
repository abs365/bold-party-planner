"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageSender {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: MessageSender | null;
}

interface MessageThreadProps {
  threadId: string;
  currentUserId: string;
  otherPartyName: string;
  onBack?: () => void;
}

export function MessageThread({ threadId, currentUserId, otherPartyName, onBack }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages/${threadId}`)
      .then((r) => r.json())
      .then((data: { messages?: Message[] }) => {
        setMessages(data.messages ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages/${threadId}`)
        .then((r) => r.json())
        .then((data: { messages?: Message[] }) => setMessages(data.messages ?? []))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [threadId]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await fetch(`/api/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const newMsg = await res.json() as Message;
      setMessages((m) => [...m, newMsg]);
    } catch { /* empty */ }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {otherPartyName[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{otherPartyName}</p>
          <p className="text-white/40 text-xs">Conversation</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-white font-semibold flex-shrink-0 mt-0.5">
                    {(msg.sender?.full_name ?? otherPartyName)[0]?.toUpperCase()}
                  </div>
                )}
                <div className={cn("max-w-[75%]")}>
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm",
                    isMe ? "bg-brand-500/25 text-white rounded-tr-sm" : "bg-white/8 text-white/90 rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <p className={cn("text-xs text-white/30 mt-0.5", isMe ? "text-right" : "text-left")}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500/50 max-h-24"
          />
          <button onClick={() => void sendMessage()} disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center disabled:opacity-40 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
