"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Sparkles, MessageCircle, MessageSquare, Loader2 } from "lucide-react";

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

export default function AiToolsClient({ tools }) {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    fetch("/api/ai/conversations")
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations || []))
      .finally(() => setLoadingChats(false));
  }, []);

  const filtered = tools.filter((t) =>
    (t.label + " " + t.description).toLowerCase().includes(query.toLowerCase())
  );
  const categories = [...new Set(filtered.map((t) => t.category))];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          AI Tools
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          Powered by Syna.
        </p>

        <div className="relative flex items-center mb-6">
          <Search size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search AI Tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Link
          href="/ai-tools/chat"
          className="flex items-center justify-between p-4 rounded-2xl mb-6"
          style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)", color: "white" }}
            >
              <MessageCircle size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">Chat with Syna</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Ask anything, no form needed
              </div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
        </Link>

        {categories.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No tools match "{query}".
          </p>
        )}

        {categories.map((category) => (
          <div key={category} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              {category}
            </h2>
            <div className="card" style={{ padding: 6 }}>
              {filtered
                .filter((t) => t.category === category)
                .map((tool, i, arr) => (
                  <Link
                    key={tool.id}
                    href={`/ai-tools/${tool.id}`}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <Sparkles size={16} style={{ color: "var(--accent)", marginTop: 2 }} />
                      <div>
                        <div className="text-sm font-medium">{tool.label}</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{tool.description}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  </Link>
                ))}
            </div>
          </div>
        ))}

        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Recent Chats
          </h2>
          {loadingChats && (
            <div className="flex justify-center py-4" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
          {!loadingChats && conversations.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No conversations yet — start one above.
            </p>
          )}
          {!loadingChats && conversations.length > 0 && (
            <div className="card" style={{ padding: 6 }}>
              {conversations.map((c, i, arr) => (
                <Link
                  key={c.id}
                  href={`/ai-tools/chat?id=${c.id}`}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="flex items-start gap-2.5" style={{ minWidth: 0 }}>
                    <MessageSquare size={16} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
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
                  <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}