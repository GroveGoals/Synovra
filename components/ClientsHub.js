"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Briefcase, AlertCircle, FileText } from "lucide-react";

export default function ClientsHub() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) setClients(data.clients || []);
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
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, email, phone }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error || "Could not create client."); return; }
    router.push(`/tools/business/clients/${data.client.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/tools/business" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> Business
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Briefcase size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Client Notes
          </h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Keep notes organized per client.
        </p>

        {!createOpen ? (
          <button onClick={() => setCreateOpen(true)} className="btn-primary mb-6">
            <Plus size={14} /> New Client
          </button>
        ) : (
          <form onSubmit={handleCreate} className="card p-4 space-y-2 mb-6">
            {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
            <input className="input pl-3" placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <input className="input pl-3" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
            <input className="input pl-3" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input pl-3" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
        ) : clients.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            No clients yet — add one above.
          </p>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <Link key={client.id} href={`/tools/business/clients/${client.id}`} className="card p-3 flex items-center gap-3">
                <FileText size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-semibold">{client.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {client.company ? `${client.company} · ` : ""}{client._count?.notes ?? 0} note{client._count?.notes === 1 ? "" : "s"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
