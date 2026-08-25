"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Loader2, FileText, Star, Trash2,
  Folder as FolderIcon, X, ClipboardCheck,
} from "lucide-react";

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
  const [tab, setTab] = useState("all"); // "all" | "assignments"
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/folders");
    const data = await res.json();
    if (res.ok) setFolders(data.folders || []);
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "assignments") params.set("assignments", "1");
      if (activeFolderId) params.set("folderId", activeFolderId);
      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setNotes(data.notes || []);
    } finally {
      setLoading(false);
    }
  }, [tab, activeFolderId]);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { loadNotes(); }, [loadNotes]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", folderId: activeFolderId || undefined }),
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

  async function handleCreateFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setSavingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => [...prev, data.folder].sort((a, b) => a.name.localeCompare(b.name)));
        setNewFolderName("");
        setNewFolderOpen(false);
      }
    } finally {
      setSavingFolder(false);
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
        <button onClick={() => router.push("/tools/school")} className="btn-text inline-flex items-center gap-1.5 mb-4">
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

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab("all")}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: tab === "all" ? "var(--accent-soft)" : "var(--surface-2)",
              color: tab === "all" ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            All Notes
          </button>
          <button
            onClick={() => setTab("assignments")}
            className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
            style={{
              background: tab === "assignments" ? "var(--accent-soft)" : "var(--surface-2)",
              color: tab === "assignments" ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <ClipboardCheck size={12} /> Assignments
          </button>
        </div>

        {tab === "all" && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveFolderId(null)}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: activeFolderId === null ? "var(--accent-soft)" : "var(--surface-2)",
                color: activeFolderId === null ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              All Folders
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFolderId(f.id)}
                className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{
                  background: activeFolderId === f.id ? "var(--accent-soft)" : "var(--surface-2)",
                  color: activeFolderId === f.id ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                <FolderIcon size={11} /> {f.name} <span style={{ opacity: 0.6 }}>({f._count?.notes ?? 0})</span>
              </button>
            ))}
            {!newFolderOpen ? (
              <button
                onClick={() => setNewFolderOpen(true)}
                className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                <Plus size={11} /> Folder
              </button>
            ) : (
              <form onSubmit={handleCreateFolder} className="flex items-center gap-1">
                <input
                  autoFocus
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", outline: "none", width: 110 }}
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <button type="submit" disabled={savingFolder || !newFolderName.trim()} aria-label="Save folder" style={{ color: "var(--accent)", background: "none", border: "none" }}>
                  {savingFolder ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
                <button type="button" onClick={() => { setNewFolderOpen(false); setNewFolderName(""); }} aria-label="Cancel" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
                  <X size={13} />
                </button>
              </form>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {tab === "assignments" ? "No assignments yet." : "No notes yet."}
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
                    {n.subject ? `${n.subject} · ` : ""}
                    {n.isAssignment && n.dueDate ? `Due ${new Date(n.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ` : ""}
                    {n.isAssignment && n.submitted ? "Submitted · " : ""}
                    {relativeTime(n.updatedAt)}
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