"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Loader2, FileText, Star, Trash2,
  ClipboardCheck, Clock, Link2,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All Notes", icon: null },
  { key: "recent", label: "Recent", icon: Clock },
  { key: "shared", label: "Shared", icon: Link2 },
  { key: "assignments", label: "Assignments", icon: ClipboardCheck },
];

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
  const [tab, setTab] = useState("all");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "assignments") params.set("assignments", "1");
      if (tab === "recent") params.set("recent", "1");
      if (tab === "shared") params.set("shared", "1");
      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setNotes(data.notes || []);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

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
        <button
          onClick={() => router.push("/tools/school")}
          className="btn-text inline-flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft size={14} /> School
        </button>

        <div className="flex items-center justify-between mb-4">
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

        <div className="flex gap-2 mb-4" style={{ overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
              style={{
                background: tab === t.key ? "var(--accent-soft)" : "var(--surface-2)",
                color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              {t.icon && <t.icon size={12} />}
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {tab === "assignments" ? "No assignments yet." :
               tab === "shared" ? "No shared notes yet." :
               tab === "recent" ? "Nothing recent yet." : "No notes yet."}
            </p>
            {tab === "all" && (
              <button onClick={handleCreate} className="btn-primary" disabled={creating}>
                <Plus size={14} /> Create your first note
              </button>
            )}
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
                {n.shareToken && <Link2 size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
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
