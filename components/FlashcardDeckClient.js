"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Shuffle, Check, RotateCcw, AlertCircle } from "lucide-react";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardDeckClient({ deckId }) {
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/flashcards/${deckId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load deck.");
        return;
      }
      setDeck(data.deck);
      setCards(data.deck.cards);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => { load(); }, [load]);

  const known = useMemo(() => cards.filter((c) => c.status === "known").length, [cards]);
  const current = cards[index];

  function handleShuffle() {
    setCards((prev) => shuffleArray(prev));
    setIndex(0);
    setFlipped(false);
  }

  function goNext() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  }

  function goPrev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  async function markStatus(status) {
    if (!current) return;
    setCards((prev) => prev.map((c) => (c.id === current.id ? { ...c, status } : c)));
    try {
      await fetch(`/api/flashcards/${deckId}/cards/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // status update is best-effort; local state already reflects it
    }
    if (index < cards.length - 1) goNext();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[480px] mt-10">
          <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-4">
            <ArrowLeft size={14} /> School
          </Link>
          <div className="alert alert-error"><AlertCircle size={15} />{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> School
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {deck.title}
          </h1>
          <button onClick={handleShuffle} aria-label="Shuffle" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
            <Shuffle size={18} />
          </button>
        </div>
        {deck.subject && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{deck.subject}</p>
        )}

        {cards.length === 0 ? (
          <p className="text-sm text-center mt-10" style={{ color: "var(--text-muted)" }}>
            This deck has no cards yet.
          </p>
        ) : (
          <>
            <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              {known} known / {cards.length} total · card {index + 1} of {cards.length}
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden", marginBottom: 20 }}>
              <div
                style={{
                  height: "100%", width: `${(known / cards.length) * 100}%`,
                  background: "var(--accent)", transition: "width 0.25s ease",
                }}
              />
            </div>

            <div
              onClick={() => setFlipped((f) => !f)}
              className="card"
              style={{
                minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: 24, cursor: "pointer", marginBottom: 16,
              }}
            >
              <div>
                <div className="text-xs mb-3" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {flipped ? "Answer" : "Question"}
                </div>
                <div className="text-base" style={{ lineHeight: 1.5 }}>
                  {flipped ? current.back : current.front}
                </div>
                <div className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
                  Tap to {flipped ? "see question" : "reveal answer"}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <button onClick={goPrev} disabled={index === 0} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)", flex: 1, opacity: index === 0 ? 0.5 : 1 }}>
                Back
              </button>
              <button onClick={goNext} disabled={index === cards.length - 1} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)", flex: 1, opacity: index === cards.length - 1 ? 0.5 : 1 }}>
                Skip
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => markStatus("review")} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)", flex: 1 }}>
                <RotateCcw size={14} /> Review again
              </button>
              <button onClick={() => markStatus("known")} className="btn-primary" style={{ flex: 1 }}>
                <Check size={14} /> Know it
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}