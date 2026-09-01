"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Send, Loader2, GraduationCap, AlertCircle,
  History, Plus, Trash2, X, MessageSquare, Paperclip, Camera, ImageIcon,
  File as FileIcon,
} from "lucide-react";
import MarkdownText from "@/components/MarkdownText";

const MAX_ATTACHMENT_BYTES = 4_000_000;

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

export default function AiTutorClient() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const bottomRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-tutor/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  async function openConversation(id) {
    const res = await fetch(`/api/ai-tutor/conversations/${id}`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.conversation.messages || []);
      setConversationId(data.conversation.id);
      setError("");
    }
    setHistoryOpen(false);
  }

  async function persist(fullMessages) {
    try {
      if (!conversationId) {
        const res = await fetch("/api/ai-tutor/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: fullMessages }),
        });
        const data = await res.json();
        if (res.ok) {
          setConversationId(data.conversation.id);
          loadConversations();
        }
      } else {
        await fetch(`/api/ai-tutor/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: fullMessages }),
        });
        loadConversations();
      }
    } catch {}
  }

  function handleFilePicked(e) {
    const file = e.target.files?.[0];
    setAttachMenuOpen(false);
    if (!file) return;
    setError("");

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("File is too large — please choose one under 4MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({ dataUrl: reader.result, name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !pendingAttachment) || loading) return;

    setError("");
    const userMsg = { role: "user", text, attachment: pendingAttachment || undefined };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setPendingAttachment(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-tutor/chat", {
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

      const finalMessages = [...nextMessages, { role: "assistant", text: data.reply }];
      setMessages(finalMessages);
      persist(finalMessages);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setConversationId(null);
    setError("");
    setPendingAttachment(null);
    setHistoryOpen(false);
  }

  async function deleteConversation(id, e) {
    e.stopPropagation();
    await fetch(`/api/ai-tutor/conversations/${id}`, { method: "DELETE" });
    setConversations((c) => c.filter((conv) => conv.id !== id));
    if (id === conversationId) startNewChat();
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      <div className="px-4 pt-6 pb-3" style={{ flexShrink: 0, maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-3">
          <ArrowLeft size={14} /> School
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} style={{ color: "var(--accent)" }} />
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              AI Tutor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
              aria-label="New session"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
              aria-label="Past sessions"
            >
              <History size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="px-4"
        style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12,
          maxWidth: 720, margin: "0 auto", width: "100%",
        }}
      >
        {messages.length === 0 && (
          <p className="text-sm text-center mt-10" style={{ color: "var(--text-muted)" }}>
            Ask your AI Tutor a question, or attach a photo of the problem to get started.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "90%",
              minWidth: 0,
              background: m.role === "user" ? "var(--accent)" : "var(--surface-2)",
              color: m.role === "user" ? "white" : "var(--text)",
              borderRadius: 14,
              padding: "12px 16px",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {m.attachment && (
              m.attachment.type?.startsWith("image/") ? (
                <img
                  src={m.attachment.dataUrl}
                  alt={m.attachment.name}
                  style={{ maxWidth: "100%", borderRadius: 10, marginBottom: m.text ? 8 : 0, display: "block" }}
                />
              ) : (
                <div
                  className="flex items-center gap-2"
                  style={{
                    background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 10px",
                    marginBottom: m.text ? 8 : 0, fontSize: 12,
                  }}
                >
                  <FileIcon size={14} /> {m.attachment.name}
                </div>
              )
            )}
            {m.role === "assistant" ? (
              m.text && <MarkdownText text={m.text} />
            ) : (
              m.text && (
                <span style={{ fontSize: 14, lineHeight: 1.5, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                  {m.text}
                </span>
              )
            )}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start", background: "var(--surface-2)", borderRadius: 14,
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, color: "var(--text-muted)",
            }}
          >
            <Loader2 size={14} className="animate-spin" /> Thinking it through…
          </div>
        )}

        {error && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-4" style={{ flexShrink: 0, maxWidth: 720, margin: "0 auto", width: "100%" }}>
        {pendingAttachment && (
          <div
            className="flex items-center justify-between mb-2 p-2 rounded-xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              {pendingAttachment.type?.startsWith("image/") ? (
                <img src={pendingAttachment.dataUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
              ) : (
                <FileIcon size={18} style={{ color: "var(--text-muted)" }} />
              )}
              <span className="text-xs" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pendingAttachment.name}
              </span>
            </div>
            <button onClick={() => setPendingAttachment(null)} aria-label="Remove attachment" style={{ color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2">
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setAttachMenuOpen((v) => !v)}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
              aria-label="Attach"
            >
              <Plus size={18} />
            </button>
            {attachMenuOpen && (
              <div
                className="card"
                style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, width: 190, padding: 6, zIndex: 20 }}
              >
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm" style={{ textAlign: "left" }}>
                  <ImageIcon size={16} /> Photo from gallery
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm" style={{ textAlign: "left" }}>
                  <Camera size={16} /> Take a photo
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm" style={{ textAlign: "left" }}>
                  <Paperclip size={16} /> Send a file
                </button>
              </div>
            )}
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFilePicked} style={{ display: "none" }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFilePicked} style={{ display: "none" }} />
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.txt" onChange={handleFilePicked} style={{ display: "none" }} />
          </div>

          <input
            className="input pl-3"
            placeholder="Ask your tutor…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && !pendingAttachment)}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--accent)", color: "white",
              opacity: loading || (!input.trim() && !pendingAttachment) ? 0.6 : 1,
            }}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          opacity: historyOpen ? 1 : 0, pointerEvents: historyOpen ? "auto" : "none",
          transition: "opacity 0.2s ease", zIndex: 90,
        }}
        onClick={() => setHistoryOpen(false)}
      />
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(320px, 86vw)",
          background: "var(--surface)", borderLeft: "1px solid var(--border)",
          transform: historyOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)", zIndex: 91,
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold">Past Sessions</h2>
          <button onClick={() => setHistoryOpen(false)} aria-label="Close" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <button
          onClick={startNewChat}
          className="flex items-center gap-2 m-3 p-3 rounded-xl text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Plus size={15} /> New Session
        </button>

        <div className="px-2 pb-4">
          {loadingHistory && (
            <div className="flex justify-center py-6" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
          {!loadingHistory && conversations.length === 0 && (
            <p className="text-xs text-center mt-6 px-4" style={{ color: "var(--text-muted)" }}>
              No sessions yet.
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => openConversation(c.id)}
              className="flex items-center justify-between gap-2 p-3 rounded-xl mb-1 cursor-pointer"
              style={{ background: c.id === conversationId ? "var(--surface-2)" : "transparent", minWidth: 0 }}
            >
              <div className="flex items-start gap-2 min-w-0">
                <MessageSquare size={15} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="text-sm font-medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(c.updatedAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                aria-label="Delete session"
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
