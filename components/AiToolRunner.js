"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Copy, Check, Sparkles } from "lucide-react";

export default function AiToolRunner({ tool }) {
  const [values, setValues] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setResult(data.result);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/ai-tools" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> AI Tools
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {tool.label}
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {tool.description}
        </p>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4 mb-6">
          {tool.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                {field.label}
              </label>
              {field.textarea ? (
                <textarea
                  className="input pl-3"
                  style={{ minHeight: 90, resize: "vertical", paddingTop: 10 }}
                  placeholder={field.placeholder}
                  value={values[field.name] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              ) : (
                <input
                  className="input pl-3"
                  placeholder={field.placeholder}
                  value={values[field.name] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {error && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? "Syna is thinking…" : "Ask Syna"}
          </button>
        </form>

        {result && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Syna generated this answer
              </h2>
              <button onClick={handleCopy} className="btn-ghost text-xs" style={{ color: "var(--text-muted)" }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="text-sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}