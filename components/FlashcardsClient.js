"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, Loader2, Layers, Trash2, AlertCircle,
  Sparkles, FileText, X, ChevronLeft, Clock,
} from "lucide-react";
import { extractNoteContent } from "@/lib/blocks";

const TOOL_OPTIONS = [
  { key: "flashcards", label: "Flashcards" },
  { key: "quiz", label: "Practice Quiz" },
  { key: "summary", label: "Summary" },
  { key: "keypoints", label: "Key-Point List" },
  { key: "revision", label: "Revision Questions" },
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

function FlashcardsClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [generatingType, setGeneratingType] = useState(null);
  const [pickerError, setPickerError] = useState("");

  const [blankOpen, setBlankOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [creating, setCreating] = useState(false);
  const [blankError, setBlankError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/study-tools");
      const data = await res.json();
      if (res.ok) setHistory(data.runs || []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const openPicker = useCallback(async (preselectNoteId) => {
    setPickerOpen(true);
    setPickerError("");
    setNotesLoading(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (res.ok) {
        setNotes(data.notes || []);
        if (preselectNoteId) {
          const match = (data.notes || []).find((n) => n.id === preselectNoteId);
          if (match) setSelectedNote(match);
        }
      } else {
        setPickerError(data.error || "Could not load notes.");
      }
    } catch {
      setPickerError("Network error. Please try again.");
    } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    const noteId = searchParams.get("noteId");
    if (noteId) openPicker(noteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(toolKey) {
    if (!selectedNote) return;
    setPickerError("");
    const { text, images } = extractNoteContent(selectedNote.content);

    if (!text.trim() && images.length === 0) {
      setPickerError(`"${selectedNote.title || "Untitled"}" doesn't have any text or images to generate from yet.`);
      return;
    }

    setGeneratingType(toolKey);
    try {
      if (toolKey === "flashcards") {
        const res = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: text, subject: selectedNote.subject || "",
            title: selectedNote.title || "Untitled", images,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setPickerError(data.error || "Could not generate flashcards."); setGeneratingType(null); return; }
        router.push(`/tools/school/flashcards/${data.deck.id}`);
        return;
      }

      const res = await fetch("/api/study-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: toolKey, notes: text, subject: selectedNote.subject || "",
          title: selectedNote.title || "Untitled", images,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPickerError(data.error || "Could not generate that."); setGeneratingType(null); return; }
      router.push(`/tools/school/smart-tools/${data.run.id}`);
    } catch {
      setPickerError("Network error. Please try again.");
      setGeneratingType(null);
    }
  }

  async function handleCreateBlank(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setBlankError("");
    const res = await fetch("/api/flashcards/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setBlankError(data.error || "Could not create deck."); return; }
    setTitle(""); setSubject(""); setBlankOpen(false);
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
          <Sparkles size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Smart Tools
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Turn your notes into flashcards, quizzes, summaries, and more.
        </p>

        {!pickerOpen ? (
          <button onClick={() => openPicker()} className="btn-primary mb-3">
            <Sparkles size={14} /> Generate from a Note
          </button>
        ) : (
          <div className="card p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {selectedNote ? selectedNote.title || "Untitled" : "Choose a note"}
              </h2>
              {selectedNote ? (
                <button onClick={() => setSelectedNote(null)} aria-label="Back to notes" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
                  <ChevronLeft size={16} />
                </button>
              ) : (
                <button onClick={() => setPickerOpen(false)} aria-label="Close" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {pickerError && <div className="alert alert-error mb-2"><AlertCircle size={14} />{pickerError}</div>}

            {!selectedNote ? (
              notesLoading ? (
                <div className="flex justify-center py-6" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No notes yet. Write one first, then come back here.
                </p>
              ) : (
                <div className="space-y-1">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm"
                      style={{ textAlign: "left", background: "var(--surface-2)" }}
                    >
                      <FileText size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {note.title || "Untitled"}{note.subject ? ` · ${note.subject}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-1">
                {TOOL_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleGenerate(opt.key)}
                    disabled={generatingType !== null}
                    className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm"
                    style={{ textAlign: "left", background: "var(--surface-2)", opacity: generatingType && generatingType !== opt.key ? 0.5 : 1 }}
                  >
                    {generatingType === opt.key ? <Loader2 size={14} className="animate-spin flex-shrink-0" /> : <Sparkles size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!blankOpen ? (
          <button
            onClick={() => setBlankOpen(true)}
            className="btn-primary mb-6"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            <Plus size={14} /> New Blank Deck
          </button>
        ) : (
          <form onSubmit={handleCreateBlank} className="card p-4 space-y-2 mb-6">
            {blankError && <div className="alert alert-error"><AlertCircle size={14} />{blankError}</div>}
            <input className="input pl-3" placeholder="Deck title (e.g. Spanish Vocab)" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            <input className="input pl-3" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary" type="submit" disabled={creating || !title.trim()}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Create"}
              </button>
              <button type="button" onClick={() => setBlankOpen(false)} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : decks.length === 0 ? (
          <p className="text-sm text-center mb-6" style={{ color: "var(--text-muted)" }}>
            No decks yet — generate one from a note above.
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {decks.map((deck) => (
              <div key={deck.id} className="card p-3 flex items-center justify-between">
                <Link href={`/tools/school/flashcards/${deck.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-semibold">{deck.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {deck._count?.cards ?? 0} card{deck._count?.cards === 1 ? "" : "s"}
                    {deck.subject ? ` · ${deck.subject}` : ""}
                  </div>
                </Link>
                <button onClick={() => handleDelete(deck.id)} aria-label="Delete deck" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Recent Study Materials</h2>
        </div>
        {historyLoading ? (
          <div className="flex justify-center py-6" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Quizzes, summaries, and other generated materials will show up here.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((run) => (
              <Link key={run.id} href={`/tools/school/smart-tools/${run.id}`} className="card p-3 flex items-center gap-3">
                <Sparkles size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {run.toolLabel}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {run.inputSummary} · {relativeTime(run.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlashcardsClient() {
  return (
    <Suspense fallback={null}>
      <FlashcardsClientInner />
    </Suspense>
  );
}