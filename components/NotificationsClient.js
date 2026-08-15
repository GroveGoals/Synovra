"use client";
import { useState, useEffect } from "react";
import { Bell, Users, Info, Trash2, Loader2 } from "lucide-react";

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

const ICONS = { community: Users, system: Info };

export default function NotificationsClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setItems(data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function deleteItem(id, e) {
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <Bell size={22} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((n) => {
        const Icon = ICONS[n.category] || Info;
        return (
          <div
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className="card flex items-start justify-between p-3.5 cursor-pointer"
            style={{ background: n.read ? "var(--surface)" : "var(--accent-soft)" }}
          >
            <div className="flex items-start gap-2.5" style={{ minWidth: 0 }}>
              <Icon size={16} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
              <div>
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{n.description}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{relativeTime(n.createdAt)}</div>
              </div>
            </div>
            <button onClick={(e) => deleteItem(n.id, e)} aria-label="Delete" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}