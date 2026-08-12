"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Heart, Trash2, ChevronDown, ChevronUp, Loader2, FolderPlus, Sparkles,
} from "lucide-react";
import MarkdownText from "@/components/MarkdownText";

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

export default function LibraryClient({ mode, collectionId }) {
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mode === "favorites") params.set("favorite", "true");
    if (collectionId) params.set("collectionId", collectionId);
    const [itemsRes, collectionsRes] = await Promise.all([
      fetch(`/api/history?${params.toString()}`),
      fetch("/api/collections"),
    ]);
    const itemsData = await itemsRes.json();
    const collectionsData = await collectionsRes.json();
    setItems(itemsData.items || []);
    setCollections(collectionsData.collections || []);
    setLoading(false);
  }, [mode, collectionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFavorite(item, e) {
    e.stopPropagation();
    const favorited = !item.favorited;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, favorited } : i)));
    await fetch(`/api/history/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited }),
    });
    if (mode === "favorites" && !favorited) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  async function deleteItem(id, e) {
    e.stopPropagation();
    await fetch(`/api/history/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function moveToCollection(item, newCollectionId, e) {
    e.stopPropagation();
    await fetch(`/api/history/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: newCollectionId || null }),
    });
    if (collectionId) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, collectionId: newCollectionId || null } : i)));
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Delete all history? This can't be undone.")) return;
    setClearing(true);
    await Promise.all(items.map((i) => fetch(`/api/history/${i.id}`, { method: "DELETE" })));
    setItems([]);
    setClearing(false);
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
      {mode === "history" && items.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="text-xs font-semibold"
            style={{ color: "var(--danger)" }}
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-10">
          <Sparkles size={22} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {mode === "favorites" ? "No favorites yet." : "No history yet."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const isOpen = expandedId === item.id;
          return (
            <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                className="flex items-start justify-between p-3.5 cursor-pointer"
                onClick={() => setExpandedId(isOpen ? null : item.id)}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--accent)" }}>
                    {item.toolLabel}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {item.inputSummary}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(item.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" style={{ marginLeft: 8 }}>
                  <button onClick={(e) => toggleFavorite(item, e)} aria-label="Favorite" style={{ color: item.favorited ? "var(--danger)" : "var(--text-muted)" }}>
                    <Heart size={17} fill={item.favorited ? "var(--danger)" : "none"} />
                  </button>
                  {isOpen ? <ChevronUp size={17} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={17} style={{ color: "var(--text-muted)" }} />}
                </div>
              </div>

              {isOpen && (
                <div className="px-3.5 pb-3.5" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <MarkdownText text={item.result} />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      <FolderPlus size={14} style={{ color: "var(--text-muted)" }} />
                      <select
                        className="input"
                        style={{ width: "auto", padding: "5px 8px", fontSize: 12 }}
                        value={item.collectionId || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => moveToCollection(item, e.target.value, e)}
                      >
                        <option value="">No collection</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={(e) => deleteItem(item.id, e)} aria-label="Delete" style={{ color: "var(--text-muted)" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}