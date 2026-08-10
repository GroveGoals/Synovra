"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import MarkdownText from "@/components/MarkdownText";

export default function SynaChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError("");
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pb-4" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="pt-6 pb-3">
        <Link href="/ai-tools" className="btn-text inline-flex items-center gap-1.5 mb-3">
          <ArrowLeft size={14} /> AI Tools
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Chat with Syna
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 py-2" style={{ minHeight: "50vh" }}>
        {messages.length === 0 && (
          <p className="text-sm text-center mt-10" style={{ color: "var(--text-muted)" }}>
            Ask Syna anything to get started.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: m.role === "user" ? "var(--accent)" : "var(--surface-2)",
              color: m.role === "user" ? "white" : "var(--text)",
              borderRadius: 14,
              padding: "10px 14px",
            }}
          >
            {m.role === "assistant" ? (
              <MarkdownText text={m.text} />
            ) : (
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</span>
            )}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "var(--surface-2)",
              borderRadius: 14,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            <Loader2 size={14} className="animate-spin" /> Syna is thinking…
          </div>
        )}

        {error && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2" style={{ position: "sticky", bottom: 0 }}>
        <input
          className="input pl-3"
          placeholder="Message Syna…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent)", color: "white", opacity: loading || !input.trim() ? 0.6 : 1 }}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}