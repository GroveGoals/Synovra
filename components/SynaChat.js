"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Send, Loader2, Sparkles, AlertCircle,
  History, Plus, Trash2, X, MessageSquare, Paperclip, Camera, ImageIcon,
  File as FileIcon, Copy, Check,
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

/* ADDED: Get the user's actual device timezone and local date/time */
function getUserDateTime() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const now = new Date();

  return {
    timezone,
    iso: now.toISOString(),
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "long",
    }).format(now),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeStyle: "long",
    }).format(now),
    weekday: new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
    }).format(now),
  };
}

/* ADDED: Understand commands such as:
   "set a timer for 5 minutes"
   "set timer for 30 seconds"
   "start a timer for 2 hours"
   "remind me in 10 minutes"
*/
function parseTimerCommand(text) {
  const match = text.match(
    /(?:set|start)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
  );

  const reminderMatch = text.match(
    /remind\s+me\s+in\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
  );

  const result = match || reminderMatch;

  if (!result) return null;

  const amount = Number(result[1]);
  const unit = result[2].toLowerCase();

  let seconds = amount;

  if (unit.startsWith("minute") || unit.startsWith("min")) {
    seconds = amount * 60;
  } else if (unit.startsWith("hour") || unit.startsWith("hr")) {
    seconds = amount * 60 * 60;
  }

  return {
    seconds: Math.round(seconds),
    amount,
    unit,
  };
}

function formatTimerDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"}`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);

  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function CopyMessageButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1"
      style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6, background: "none", border: "none" }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SynaChatInner() {
  const searchParams = useSearchParams();
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

  /* ADDED: Timer state */
  const [timerEndAt, setTimerEndAt] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(0);

  const bottomRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ADDED: Real timer countdown */
  useEffect(() => {
    if (!timerEndAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, timerEndAt - Date.now());

      setTimerRemaining(remaining);

      if (remaining <= 0) {
        setTimerEndAt(null);
        setTimerRemaining(0);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "⏰ Your timer is finished!",
          },
        ]);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Syna Timer", {
            body: "⏰ Your timer is finished!",
          });
        } else {
          try {
            alert("⏰ Your timer is finished!");
          } catch {
            // Ignore alert errors.
          }
        }
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 250);

    return () => clearInterval(interval);
  }, [timerEndAt]);

  /* ADDED: Ask permission for timer notifications */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.conversation.messages);
        setConversationId(data.conversation.id);
        setError("");
      }
    } finally {
      setHistoryOpen(false);
    }
  }, []);

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) openConversation(idFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(fullMessages) {
    try {
      if (!conversationId) {
        const res = await fetch("/api/ai/conversations", {
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
        await fetch(`/api/ai/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: fullMessages }),
        });
        loadConversations();
      }
    } catch {
      // Persistence failing shouldn't break the chat itself.
    }
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

    /* ADDED: Handle actual timer commands */
    const timer = text ? parseTimerCommand(text) : null;

    if (timer && !pendingAttachment) {
      const durationText = formatTimerDuration(timer.seconds);

      const userMsg = {
        role: "user",
        text,
      };

      const timerReply = {
        role: "assistant",
        text: `⏱️ Timer set for **${durationText}**. I'll let you know when it's finished.`,
      };

      const timerMessages = [...messages, userMsg, timerReply];

      setMessages(timerMessages);
      setInput("");
      setPendingAttachment(null);

      const endAt = Date.now() + timer.seconds * 1000;
      setTimerEndAt(endAt);
      setTimerRemaining(timer.seconds * 1000);

      persist(timerMessages);
      return;
    }

    const userMsg = { role: "user", text, attachment: pendingAttachment || undefined };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setPendingAttachment(null);
    setLoading(true);

    try {
      /* ADDED: Send the user's real local timezone/date/time to Syna */
      const clientDateTime = getUserDateTime();

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          clientDateTime,
        }),
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
    await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
    setConversations((c) => c.filter((conv) => conv.id !== id));
    if (id === conversationId) startNewChat();
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pb-4" style={{ maxWidth: 720, margin: "0 auto", overflowX: "hidden" }}>
      <div className="pt-6 pb-3">
        <Link href="/ai-tools" className="btn-text inline-flex items-center gap-1.5 mb-3">
          <ArrowLeft size={14} /> AI Tools
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: "var(--accent)" }} />
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Chat with Syna
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
              aria-label="New chat"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
              aria-label="Recent chats"
            >
              <History size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 py-2" style={{ minHeight: "50vh", overflowX: "hidden" }}>
        {messages.length === 0 && (
          <p className="text-sm text-center mt-10" style={{ color: "var(--text-muted)" }}>
            Ask Syna anything, or attach a photo or file to get started.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              minWidth: 0,
              background: m.role === "user" ? "var(--accent)" : "var(--surface-2)",
              color: m.role === "user" ? "white" : "var(--text)",
              borderRadius: 14,
              padding: "10px 14px",
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
              m.text && (
                <>
                  <MarkdownText text={m.text} />
                  <CopyMessageButton text={m.text} />
                </>
              )
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

      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2" style={{ position: "sticky", bottom: 0 }}>
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
              style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: 0, width: 190,
                padding: 6, zIndex: 20,
              }}
            >
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                style={{ textAlign: "left" }}
              >
                <ImageIcon size={16} /> Photo from gallery
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                style={{ textAlign: "left" }}
              >
                <Camera size={16} /> Take a photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                style={{ textAlign: "left" }}
              >
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
          placeholder="Message Syna…"
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

      {/* ADDED: Show active timer */}
      {timerEndAt && (
        <div
          className="text-center text-xs mt-2"
          style={{
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          ⏱️ Timer: {formatTimerDuration(Math.ceil(timerRemaining / 1000))} remaining
        </div>
      )}

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
          <h2 className="text-sm font-semibold">Recent Chats</h2>
          <button onClick={() => setHistoryOpen(false)} aria-label="Close" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <button
          onClick={startNewChat}
          className="flex items-center gap-2 m-3 p-3 rounded-xl text-sm font-medium"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Plus size={15} /> New Chat
        </button>

        <div className="px-2 pb-4">
          {loadingHistory && (
            <div className="flex justify-center py-6" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
          {!loadingHistory && conversations.length === 0 && (
            <p className="text-xs text-center mt-6 px-4" style={{ color: "var(--text-muted)" }}>
              No conversations yet.
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => openConversation(c.id)}
              className="flex items-center justify-between gap-2 p-3 rounded-xl mb-1 cursor-pointer"
              style={{
                background: c.id === conversationId ? "var(--surface-2)" : "transparent",
                minWidth: 0,
              }}
            >
              <div className="flex items-start gap-2 min-w-0">
                <MessageSquare size={15} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div
                    className="text-sm font-medium"
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {c.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(c.updatedAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                aria-label="Delete conversation"
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

export default function SynaChat() {
  return (
    <Suspense fallback={null}>
      <SynaChatInner />
    </Suspense>
  );
}