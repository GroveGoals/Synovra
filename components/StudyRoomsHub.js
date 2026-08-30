"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Users, AlertCircle, Timer } from "lucide-react";

export default function StudyRoomsHub() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-rooms");
      const data = await res.json();
      if (res.ok) setRooms(data.rooms || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/study-rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error || "Could not create room."); return; }
    router.push(`/tools/school/study-room/${data.room.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> School
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Users size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Study Rooms
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Study solo, or invite friends to join you.
        </p>

        {!createOpen ? (
          <button onClick={() => setCreateOpen(true)} className="btn-primary mb-6">
            <Plus size={14} /> New Study Room
          </button>
        ) : (
          <form onSubmit={handleCreate} className="card p-4 space-y-2 mb-6">
            {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
            <input className="input pl-3" placeholder="Room name (e.g. Finals Week)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <input className="input pl-3" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary" type="submit" disabled={creating || !name.trim()}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Create"}
              </button>
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            No study rooms yet — create one above.
          </p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => router.push(`/tools/school/study-room/${room.id}`)}
                className="card p-3 flex items-center gap-3 cursor-pointer"
              >
                {room.timerStartedAt ? (
                  <Timer size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                ) : (
                  <Users size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-semibold">{room.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {room._count?.members ?? 1} member{room._count?.members === 1 ? "" : "s"}
                    {room.subject ? ` · ${room.subject}` : ""}
                  </div>
                </div>
                {room.myStatus === "invited" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    Invited
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
