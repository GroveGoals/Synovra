"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ImageIcon, X, AlertCircle } from "lucide-react";

const MAX_ATTACHMENT_BYTES = 4_000_000;

export default function FlashcardGenerator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function handleFilesPicked(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`"${file.name}" is too large — please choose one under 4MB.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, { dataUrl: reader.result, name: file.name, type: file.type }]);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!notes.trim() && images.length === 0) {
      setError("Add some notes or attach an image first.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, subject, images }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate flashcards.");
        setLoading(false);
        return;
      }
      router.push(`/tools/school/flashcards/${data.deck.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary mb-6">
        <Sparkles size={14} /> Generate Flashcards from Notes
      </button>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="card p-4 space-y-2 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} style={{ color: "var(--accent)" }} />
        <h2 className="text-sm font-semibold">Generate Flashcards</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <textarea
        className="input pl-3"
        style={{ minHeight: 120, paddingTop: 10, resize: "vertical" }}
        placeholder="Paste or write your notes here…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        autoFocus
      />

      <input
        className="input pl-3"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <img
                src={img.dataUrl}
                alt={img.name}
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                aria-label="Remove image"
                style={{
                  position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
                  background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        >
          <ImageIcon size={14} /> Attach Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesPicked}
          style={{ display: "none" }}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button className="btn-primary" type="submit" disabled={loading || (!notes.trim() && images.length === 0)}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Generate"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="btn-primary"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}