"use client";

import { useState, useEffect, useCallback } from "react";
import { StickyNote, Plus, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Note {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export function CustomerNotesWidget({ customerId }: { customerId: string }) {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/vendor/customers/${customerId}/notes`);
    if (res.ok) {
      const json = await res.json() as { notes: Note[] };
      setNotes(json.notes);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    const res = await fetch(`/api/vendor/customers/${customerId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: text }),
    });
    if (res.ok) {
      const json = await res.json() as { note: Note };
      setNotes((prev) => [json.note, ...prev]);
      setText("");
    }
    setSaving(false);
  }

  async function handleDelete(noteId: string) {
    setDeleting(noteId);
    await fetch(`/api/vendor/customers/${customerId}/notes?note_id=${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setDeleting(null);
  }

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
        <StickyNote className="w-4 h-4 text-amber-400" />
        Private Notes
        <span className="text-white/30 text-xs font-normal">(only visible to you)</span>
      </h3>

      {/* Input */}
      <div className="space-y-2 mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleSave(); }}
          placeholder="Add a private note about this customer…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
        />
        <div className="flex justify-between items-center">
          <span className="text-white/25 text-xs">Cmd+Enter to save</span>
          <button
            onClick={() => void handleSave()}
            disabled={!text.trim() || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Save note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-lg animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-white/30 text-xs text-center py-3">No notes yet. Add your first note above.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="group bg-white/3 border border-white/6 rounded-lg px-3 py-2.5 flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{n.note}</p>
                <p className="text-white/25 text-xs mt-1">{formatDate(n.created_at)}</p>
              </div>
              <button
                onClick={() => void handleDelete(n.id)}
                disabled={deleting === n.id}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all self-start flex-shrink-0"
              >
                {deleting === n.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
