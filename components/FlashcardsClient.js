"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Layers, Trash2, AlertCircle } from "lucide-react";

export default function FlashcardsClient() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/flashcards/decks");
      const data = await res.json();
      if (res.ok) setDecks(data.decks || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/flashcards/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Could not create deck.");
      return;
    }
    setTitle("");
    setSubject("");
    setDecks((prev) => [data.deck, ...prev]);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this deck and all its cards?")) return;
    await fetch(`/api/flashcards/decks/${id}`, { method: "DELETE" });
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> School
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Layers size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Flashcards
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Create decks and study them anytime.
        </p>

        <form onSubmit={handleCreate} className="card p-4 space-y-2 mb-6">
          {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
          <input
            className="input pl-3"
            placeholder="Deck title (e.g. Spanish Vocab)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input pl-3"
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={creating || !title.trim()}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            New Deck
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : decks.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            No decks yet — create one above.
          </p>
        ) : (
          <div className="space-y-2">
            {decks.map((deck) => (
              <div key={deck.id} className="card p-3 flex items-center justify-between">
                <Link href={`/tools/school/flashcards/${deck.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-semibold">{deck.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {deck._count?.cards ?? 0} card{deck._count?.cards === 1 ? "" : "s"}
                    {deck.subject ? ` · ${deck.subject}` : ""}
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(deck.id)}
                  aria-label="Delete deck"
                  style={{ color: "var(--text-muted)", background: "none", border: "none" }}
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