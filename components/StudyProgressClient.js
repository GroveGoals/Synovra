"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, AlertCircle, Clock, BarChart3 } from "lucide-react";

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

function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
}

export default function StudyProgressClient() {
  const [sessions, setSessions] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [bySubject, setBySubject] = useState({});
  const [loading, setLoading] = useState(true);

  const [logOpen, setLogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-sessions");
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
        setTotalMinutes(data.totalMinutes || 0);
        setBySubject(data.bySubject || {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLog(e) {
    e.preventDefault();
    if (!subject.trim() || !minutes) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, minutes: Number(minutes), note }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Could not log session."); return; }
    setSubject(""); setMinutes(""); setNote(""); setLogOpen(false);
    load();
  }

  const maxSubjectMinutes = Math.max(1, ...Object.values(bySubject));
  const subjectEntries = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> School
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Study Progress
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Time you've spent studying, from Study Rooms and logged manually.
        </p>

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="card p-4 mb-4 text-center">
              <div className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {formatMinutes(totalMinutes)}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>total time studied</div>
            </div>

            {!logOpen ? (
              <button onClick={() => setLogOpen(true)} className="btn-primary mb-6">
                <Plus size={14} /> Log a Session
              </button>
            ) : (
              <form onSubmit={handleLog} className="card p-4 space-y-2 mb-6">
                {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
                <input className="input pl-3" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus />
                <input className="input pl-3" type="number" min="1" max="600" placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                <input className="input pl-3" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <button className="btn-primary" type="submit" disabled={saving || !subject.trim() || !minutes}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                  </button>
                  <button type="button" onClick={() => setLogOpen(false)} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {subjectEntries.length > 0 && (
              <>
                <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>By Subject</h2>
                <div className="space-y-2 mb-6">
                  {subjectEntries.map(([subj, mins]) => (
                    <div key={subj}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{subj}</span>
                        <span style={{ color: "var(--text-muted)" }}>{formatMinutes(mins)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(mins / maxSubjectMinutes) * 100}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Recent Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No sessions yet — study in a Study Room or log one manually.
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="card p-3 flex items-center gap-3">
                    <Clock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm font-medium">{s.subject}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.note ? `${s.note} · ` : ""}{relativeTime(s.createdAt)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{formatMinutes(s.minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
