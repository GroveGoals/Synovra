"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, Plus, Check, X, Loader2, Crown } from "lucide-react";

export default function CommunitiesClient() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (q) => {
    setLoading(true);
    const res = await fetch(`/api/communities?q=${encodeURIComponent(q || "")}`);
    const data = await res.json();
    setCommunities(data.communities || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => load(query), 300);
    return () => clearTimeout(handle);
  }, [query, load]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create community.");
      return;
    }
    setNewName("");
    setNewDescription("");
    setCreating(false);
    load(query);
  }

  async function toggleMembership(c, e) {
    e.preventDefault();
    e.stopPropagation();
    if (c.isMember) {
      await fetch(`/api/communities/${c.id}/membership`, { method: "DELETE" });
    } else {
      await fetch(`/api/communities/${c.id}/membership`, { method: "POST" });
    }
    load(query);
  }

  return (
    <div>
      <div className="relative flex items-center mb-4">
        <Search size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
        <input
          className="input"
          placeholder="Search communities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {creating ? (
        <form onSubmit={handleCreate} className="card p-4 mb-4 space-y-3">
          {error && <div className="alert alert-error">{error}</div>}
          <input
            className="input pl-3"
            placeholder="Community name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <input
            className="input pl-3"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" style={{ maxWidth: 140 }}>
              <Check size={15} /> Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="btn-primary"
              style={{ maxWidth: 140, background: "var(--surface-2)", color: "var(--text)" }}
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Plus size={16} /> Create Community
        </button>
      )}

      {loading && (
        <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {!loading && communities.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
          No communities found.
        </p>
      )}

      <div className="space-y-2">
        {communities.map((c) => (
          <Link key={c.id} href={`/communities/${c.id}`} className="card flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
              {c.iconDataUrl ? (
                <img src={c.iconDataUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "var(--font-display)" }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                  {c.isOwner && <Crown size={12} style={{ color: "var(--premium, #F0B75E)" }} />}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            {!c.isOwner && (
              <button
                onClick={(e) => toggleMembership(c, e)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                style={
                  c.isMember
                    ? { background: "var(--surface-2)", color: "var(--text-muted)" }
                    : { background: "var(--accent)", color: "white" }
                }
              >
                {c.isMember ? "Joined" : "Join"}
              </button>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}