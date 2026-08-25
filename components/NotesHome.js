"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, FileText, Star, Trash2 } from "lucide-react";

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotesHome() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (res.ok) setNotes(data.notes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/notes/${data.note.id}`);
        return;
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Notes
          </h1>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent)", color: "white" }}
            aria-label="New note"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              No notes yet.
            </p>
            <button onClick={handleCreate} className="btn-primary" disabled={creating}>
              <Plus size={14} /> Create your first note
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => router.push(`/notes/${n.id}`)}
                className="card p-3 flex items-center gap-3 cursor-pointer"
              >
                <FileText size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.title || "Untitled"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {n.subject ? `${n.subject} · ` : ""}{relativeTime(n.updatedAt)}
                  </div>
                </div>
                {n.pinned && <Star size={14} style={{ color: "var(--accent)", flexShrink: 0 }} fill="var(--accent)" />}
                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  aria-label="Delete note"
                  style={{ color: "var(--text-muted)", background: "none", border: "none", flexShrink: 0 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}