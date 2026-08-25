"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

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

export default function FavouritesClient() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/favourites");
        const data = await res.json();
        if (res.ok) setGroups(data.groups || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <div className="flex items-center gap-2 mb-6">
          <Star size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Favourites
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-center mt-10" style={{ color: "var(--text-muted)" }}>
            Nothing favourited yet. Star a note, chat, or tool result to see it here.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.key}>
                <h2 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(item.href)}
                      className="card p-3 flex items-center gap-3 cursor-pointer"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-sm font-medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.subtitle ? `${item.subtitle} · ` : ""}{relativeTime(item.updatedAt)}
                        </div>
                      </div>
                      <Star size={14} style={{ color: "var(--accent)", flexShrink: 0 }} fill="var(--accent)" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}