"use client";
import { useState } from "react";
import { Loader2, Star, Copy, Check, RotateCcw, AlertCircle } from "lucide-react";

export default function AiToolRunner({ toolId, title, description, placeholder }) {
  const [input, setInput] = useState("");
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setRun(data.run);
    } catch (err) {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite() {
    if (!run) return;
    const res = await fetch(`/api/tool-runs/${run.id}/favorite`, { method: "PATCH" });
    const data = await res.json();
    if (res.ok) setRun(data.run);
  }

  function handleCopy() {
    if (!run?.result) return;
    navigator.clipboard.writeText(run.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleReset() {
    setRun(null);
    setInput("");
    setError("");
  }

  return (
    <div className="p-4">
      <style>{`
        .ai-tool-title { font-size: 19px; font-weight: 600; font-family: var(--font-display); margin-bottom: 2px; }
        .ai-tool-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
        .ai-tool-textarea {
          width: 100%; min-height: 110px; resize: vertical; padding: 12px 14px; font-size: 14px;
          border-radius: 14px; border: 1px solid var(--border); background: var(--surface);
          color: var(--text); font-family: inherit;
        }
        .ai-tool-result {
          margin-top: 16px; padding: 16px; border-radius: 14px; border: 1px solid var(--border);
          background: var(--surface); white-space: pre-wrap; font-size: 14px; line-height: 1.55;
          overflow-wrap: anywhere;
        }
        .ai-tool-actions { display: flex; gap: 8px; margin-top: 10px; }
        .ai-tool-icon-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
          font-size: 12.5px; font-weight: 500; cursor: pointer;
        }
      `}</style>

      <div className="ai-tool-title">{title}</div>
      {description && <div className="ai-tool-desc">{description}</div>}

      {!run && (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error mb-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <textarea
            className="ai-tool-textarea"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary mt-3" disabled={loading || !input.trim()}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Generate"}
          </button>
        </form>
      )}

      {run && (
        <div>
          <div className="ai-tool-result">{run.result}</div>
          <div className="ai-tool-actions">
            <button className="ai-tool-icon-btn" onClick={handleFavorite}>
              <Star size={14} fill={run.favorited ? "var(--accent)" : "none"} color={run.favorited ? "var(--accent)" : "currentColor"} />
              {run.favorited ? "Favorited" : "Favorite"}
            </button>
            <button className="ai-tool-icon-btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
            <button className="ai-tool-icon-btn" onClick={handleReset}>
              <RotateCcw size={14} /> Run again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}