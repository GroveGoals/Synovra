"use client";
import { useState, useEffect } from "react";
import {
  FolderOpen, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, X, Check,
} from "lucide-react";
import LibraryClient from "@/components/LibraryClient";

export default function CollectionsClient() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/collections");
    const data = await res.json();
    setCollections(data.collections || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewName("");
      setCreating(false);
      load();
    }
  }

  async function handleRename(id) {
    const name = renameValue.trim();
    if (!name) return;
    await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setRenamingId(null);
    load();
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this collection? Items inside will move back to History.")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (expandedId === id) setExpandedId(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {creating ? (
        <form onSubmit={handleCreate} className="flex items-center gap-2 mb-4">
          <input
            className="input pl-3"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)", color: "white" }}>
            <Check size={16} />
          </button>
          <button type="button" onClick={() => { setCreating(false); setNewName(""); }} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            <X size={16} />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Plus size={16} /> New Collection
        </button>
      )}

      {collections.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
          No collections yet — create one to organize your saved AI results.
        </p>
      )}

      <div className="space-y-2">
        {collections.map((c) => {
          const isOpen = expandedId === c.id;
          return (
            <div key={c.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                className="flex items-center justify-between p-3.5 cursor-pointer"
                onClick={() => setExpandedId(isOpen ? null : c.id)}
              >
                <div className="flex items-center gap-2.5" style={{ minWidth: 0 }}>
                  <FolderOpen size={17} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  {renamingId === c.id ? (
                    <input
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 14 }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(c.id)}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {c._count.toolRuns} item{c._count.toolRuns === 1 ? "" : "s"}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {renamingId === c.id ? (
                    <button onClick={(e) => { e.stopPropagation(); handleRename(c.id); }} style={{ color: "var(--accent)" }}>
                      <Check size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingId(c.id); setRenameValue(c.name); }}
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Rename"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <button onClick={(e) => handleDelete(c.id, e)} aria-label="Delete" style={{ color: "var(--text-muted)" }}>
                    <Trash2 size={15} />
                  </button>
                  {isOpen ? <ChevronUp size={17} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={17} style={{ color: "var(--text-muted)" }} />}
                </div>
              </div>

              {isOpen && (
                <div className="px-3 pb-3" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <LibraryClient mode="collection" collectionId={c.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}