"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, ChevronLeft, ChevronRight, Trash2, AlertCircle, RotateCw } from "lucide-react";

export default function FlashcardDeckClient({ deckId }) {
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}`);
      const data = await res.json();
      if (res.ok) setDeck(data.deck);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => { load(); }, [load]);

  async function handleAddCard(e) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setAdding(true);
    setError("");
    const res = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front, back }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setError(data.error || "Could not add card.");
      return;
    }
    setDeck((prev) => ({ ...prev, cards: [...prev.cards, data.card] }));
    setFront("");
    setBack("");
    setShowAddForm(false);
  }

  async function handleDeleteCard(id) {
    if (!window.confirm("Delete this card?")) return;
    await fetch(`/api/flashcards/cards/${id}`, { method: "DELETE" });
    setDeck((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== id) }));
    setIndex(0);
    setFlipped(false);
  }

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1) % deck.cards.length);
  }
  function prev() {
    setFlipped(false);
    setIndex((i) => (i - 1 + deck.cards.length) % deck.cards.length);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (!deck) {
    return <p className="text-sm text-center py-16" style={{ color: "var(--text-muted)" }}>Deck not found.</p>;
  }

  const card = deck.cards[index];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/school/flashcards" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> Flashcards
        </Link>

        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          {deck.title}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {deck.cards.length} card{deck.cards.length === 1 ? "" : "s"}
        </p>

        {deck.cards.length === 0 ? (
          <p className="text-sm text-center mb-6" style={{ color: "var(--text-muted)" }}>
            No cards yet — add one below to start studying.
          </p>
        ) : (
          <div className="mb-6">
            <div
              onClick={() => setFlipped((f) => !f)}
              className="card"
              style={{
                minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: 24, cursor: "pointer", position: "relative",
              }}
            >
              <div className="flex items-center gap-1.5 absolute" style={{ top: 12, right: 12, color: "var(--text-muted)" }}>
                <RotateCw size={13} />
              </div>
              <p className="text-base" style={{ overflowWrap: "anywhere" }}>
                {flipped ? card.back : card.front}
              </p>
            </div>

            <div className="flex items-center justify-between mt-3">
              <button onClick={prev} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)", maxWidth: 100 }}>
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {index + 1} / {deck.cards.length}
              </span>
              <button onClick={next} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)", maxWidth: 100 }}>
                <ChevronRight size={15} />
              </button>
            </div>

            <button
              onClick={() => handleDeleteCard(card.id)}
              className="flex items-center gap-1 text-xs mt-3"
              style={{ color: "var(--text-muted)", background: "none", border: "none" }}
            >
              <Trash2 size={13} /> Delete this card
            </button>
          </div>
        )}

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            <Plus size={14} /> Add Card
          </button>
        ) : (
          <form onSubmit={handleAddCard} className="card p-4 space-y-2">
            {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
            <textarea
              className="input pl-3"
              style={{ minHeight: 60 }}
              placeholder="Front (question/term)"
              value={front}
              onChange={(e) => setFront(e.target.value)}
            />
            <textarea
              className="input pl-3"
              style={{ minHeight: 60 }}
              placeholder="Back (answer/definition)"
              value={back}
              onChange={(e) => setBack(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn-primary" type="submit" disabled={adding || !front.trim() || !back.trim()}>
                {adding ? <Loader2 size={14} className="animate-spin" /> : "Add"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}