"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Minimize2, Maximize2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What vendors do I need for a wedding?",
  "Help me plan a 50-person birthday party",
  "What's a realistic budget for a corporate event?",
  "Suggest a backup plan for outdoor events",
  "What entertainment combinations work best?",
];

interface SmartConciergeProps {
  eventId?: string;
  eventTitle?: string;
}

const WELCOME: Message = {
  role: "assistant",
  content: "Hello! I'm your Smart Event Concierge. I'm here to help you plan a flawless event â€” from vendor recommendations to timelines, budgets, and inspiration. What are you planning?",
};

export function SmartConcierge({ eventId, eventTitle }: SmartConciergeProps) {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const historyLoadedRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: eventTitle
        ? `Hello! I'm your Smart Event Concierge. I can see you're planning **${eventTitle}** â€” I'm here to help with vendor suggestions, timeline planning, budget tips, and anything else you need. What would you like help with?`
        : WELCOME.content,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from DB when opening for the first time
  useEffect(() => {
    if (!open || historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    const url = eventId ? `/api/smart-concierge?event_id=${eventId}` : "/api/smart-concierge";
    fetch(url)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const history = (data as { role: string; content: string }[])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        if (history.length > 0) {
          setMessages([
            {
              role: "assistant",
              content: eventTitle
                ? `Welcome back! We've been planning **${eventTitle}** together. Here's our conversation history â€” how can I help you further?`
                : "Welcome back! Here's your recent conversation history. How can I help you today?",
            },
            ...history.slice(-20),
          ]);
        }
      })
      .catch(() => { /* keep default welcome message */ });
  }, [open, eventId, eventTitle]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/smart-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          event_id: eventId,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? "I'm sorry, I couldn't process that. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (!open) setUnread(true);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble connecting. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setUnread(false); }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-brand shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Open Smart Concierge"
        >
          <Sparkles className="w-6 h-6 text-white" />
          {unread && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0f]" />}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl bg-[#13131f] border border-white/10 shadow-2xl transition-all duration-200",
          minimised ? "w-72 h-14" : "w-80 sm:w-96 h-[520px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 gradient-brand rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">Smart Concierge</span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimised((m) => !m)} className="p-1 text-white/70 hover:text-white rounded">
                {minimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1 text-white/70 hover:text-white rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-brand-500/20 text-white rounded-tr-sm"
                        : "bg-white/8 text-white/90 rounded-tl-sm"
                    )}>
                      {msg.content.split("\n").map((line, j) => (
                        <p key={j} className={j > 0 ? "mt-1" : ""}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/8 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-white/40 text-xs mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.slice(0, 3).map((s) => (
                      <button key={s} onClick={() => void sendMessage(s)}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/70 hover:bg-white/15 hover:text-white transition-colors text-left">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-white/10 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about your event..."
                    rows={1}
                    className="flex-1 bg-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500/50 max-h-24"
                    style={{ minHeight: "36px" }}
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-white/20 text-xs text-center mt-2">Smart Event Concierge Â· ELBOLD Events</p>
              </div>
            </>
          )}

          {minimised && (
            <button onClick={() => setMinimised(false)} className="flex-1 flex items-center justify-between px-4 text-white/50 hover:text-white">
              <span className="text-xs">Continue conversation...</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
