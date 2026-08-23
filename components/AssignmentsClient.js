"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, ClipboardList, Trash2, AlertCircle } from "lucide-react";

function formatDue(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (diffDays < 0) return { label: `${label} (overdue)`, overdue: true };
  if (diffDays === 0) return { label: `${label} (today)`, overdue: false };
  return { label, overdue: false };
}

export default function AssignmentsClient() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assignments");
      const data = await res.json();
      if (res.ok) setAssignments(data.assignments || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, dueDate: dueDate || null }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Could not create assignment.");
      return;
    }
    setAssignments((prev) => [...prev, data.assignment].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }));
    setTitle(""); setSubject(""); setDueDate(""); setShowForm(false);
  }

  async function handleToggle(assignment) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignment.id ? { ...a, completed: !a.completed } : a))
    );
    await fetch(`/api/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !assignment.completed }),
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this assignment?")) return;
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/school" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> School
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Assignments
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Track what's due and check it off.
        </p>

        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-primary mb-6">
            <Plus size={14} /> New Assignment
          </button>
        ) : (
          <form onSubmit={handleCreate} className="card p-4 space-y-2 mb-6">
            {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
            <input className="input pl-3" placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            <input className="input pl-3" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <input className="input pl-3" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary" type="submit" disabled={creating || !title.trim()}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Add"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            No assignments yet.
          </p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => {
              const due = formatDue(a.dueDate);
              return (
                <div key={a.id} className="card p-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={a.completed}
                    onChange={() => handleToggle(a)}
                    style={{ marginTop: 3 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="text-sm font-medium"
                      style={{ textDecoration: a.completed ? "line-through" : "none", color: a.completed ? "var(--text-muted)" : "var(--text)" }}
                    >
                      {a.title}
                    </div>
                    <div className="text-xs" style={{ color: due?.overdue ? "var(--danger, #e55)" : "var(--text-muted)" }}>
                      {a.subject ? `${a.subject}` : ""}{a.subject && due ? " · " : ""}{due?.label || ""}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)} aria-label="Delete assignment" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}