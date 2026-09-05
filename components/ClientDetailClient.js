"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, FileText, Trash2, AlertCircle, Mail, Phone, Building2 } from "lucide-react";

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

export default function ClientDetailClient({ clientId }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();
      if (res.ok) setClient(data.client);
      else setError(data.error || "Could not load client.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function handleNewNote() {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", clientId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/notes/${data.note.id}`);
        return;
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteClient() {
    if (!window.confirm(`Delete ${client.name}? Their notes will stay, just unlinked from this client.`)) return;
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    router.push("/client-notes");
  }

  if (loading) {
    return <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}><Loader2 size={22} className="animate-spin" /></div>;
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[480px] mt-10">
          <button onClick={() => router.push("/client-notes")} className="btn-text inline-flex items-center gap-1.5 mb-4">
            <ArrowLeft size={14} /> Client Notes
          </button>
          <div className="alert alert-error"><AlertCircle size={15} />{error || "Client not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <button onClick={() => router.push("/client-notes")} className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> Client Notes
        </button>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {client.name}
          </h1>
          <button onClick={handleDeleteClient} aria-label="Delete client" style={{ color: "var(--danger, #e55)", background: "none", border: "none" }}>
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-1 mb-6">
          {client.company && (
            <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Building2 size={13} /> {client.company}
            </div>
          )}
          {client.email && (
            <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Mail size={13} /> {client.email}
            </div>
          )}
          {client.phone && (
            <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Phone size={13} /> {client.phone}
            </div>
          )}
        </div>

        <button onClick={handleNewNote} disabled={creating} className="btn-primary mb-6">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} New Note
        </button>

        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Notes</h2>
        {client.notes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No notes yet for this client.
          </p>
        ) : (
          <div className="space-y-2">
            {client.notes.map((note) => (
              <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="card p-3 flex items-center gap-3 cursor-pointer"
              >
                <FileText size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-medium">{note.title || "Untitled"}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{relativeTime(note.updatedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}