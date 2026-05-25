"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { VENDOR_CATEGORIES } from "@/types";

interface Recommendation {
  category: keyof typeof VENDOR_CATEGORIES;
  reason: string;
  priority: "essential" | "recommended" | "optional";
  budget_hint: string;
}

interface SmartRecommendationsPanelProps {
  eventId: string;
  eventType: string;
  guestCount: number;
  budget: number;
  city: string;
  existingCategories: string[];
}

const PRIORITY_COLOR = {
  essential: "bg-red-500/15 text-red-400 border-red-500/30",
  recommended: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  optional: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export function SmartRecommendationsPanel({
  eventId,
  eventType,
  guestCount,
  budget,
  city,
  existingCategories,
}: SmartRecommendationsPanelProps) {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const prompt = `Give me vendor recommendations for a ${eventType} event in ${city} for ${guestCount} guests with a budget of £${budget}.
The customer already has these vendors booked: ${existingCategories.join(", ") || "none"}.
Return a JSON array of up to 6 vendor category recommendations in this exact format:
[{"category":"dj","reason":"short reason","priority":"essential|recommended|optional","budget_hint":"£X–£Y"}]
Only use these exact category values: dj, photographer, videographer, caterer, decorator, mc, security, makeup_artist, cake_maker, balloon_decorator, lighting_stage, furniture_rental, marquee_rental, live_band, transport.
Do not suggest categories the customer already has. Be specific to the event type and UK market.`;

      const res = await fetch("/api/smart-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          event_id: eventId,
          history: [],
        }),
      });

      const data = await res.json() as { reply?: string; error?: string };
      if (!data.reply) throw new Error("No response");

      // Extract JSON from the reply
      const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No recommendations returned");

      const parsed = JSON.parse(jsonMatch[0]) as Recommendation[];
      setRecs(Array.isArray(parsed) ? parsed.slice(0, 6) : []);
    } catch {
      setError("Unable to load Smart Recommendations right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!recs && !loading) {
    return (
      <div className="glass-card p-5 border border-brand-500/15">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Smart Vendor Recommendations</h3>
            <p className="text-xs text-white/40">Tailored suggestions for your event</p>
          </div>
        </div>
        <button
          onClick={() => void fetchRecommendations()}
          className="btn-primary text-sm py-2 px-4 w-full"
        >
          <Sparkles className="w-4 h-4" />
          Get Smart Recommendations
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 border border-brand-500/15">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Smart Recommendations</h3>
            <p className="text-xs text-white/40">Based on your event details</p>
          </div>
        </div>
        {recs && (
          <button
            onClick={() => void fetchRecommendations()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2 text-white/40">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Thinking about your event...</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 text-center py-4">{error}</div>
      )}

      {recs && !loading && (
        <div className="space-y-2">
          {recs.map((rec, i) => {
            const cat = VENDOR_CATEGORIES[rec.category];
            if (!cat) return null;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/6 transition-colors">
                <div className="text-xl flex-shrink-0">{cat.icon ?? "🎉"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-white">{cat.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${PRIORITY_COLOR[rec.priority]}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-snug">{rec.reason}</p>
                  <p className="text-xs text-brand-400 mt-0.5">{rec.budget_hint}</p>
                </div>
                <Link
                  href={`/browse?category=${rec.category}`}
                  className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 transition-colors flex-shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
          <Link href="/browse" className="block text-center text-xs text-brand-400 hover:text-brand-300 pt-2 transition-colors">
            Browse all vendor categories <ChevronRight className="w-3 h-3 inline" />
          </Link>
        </div>
      )}
    </div>
  );
}
