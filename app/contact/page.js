"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import NavShell from "@/components/NavShell";

export default function ContactPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((data) => {
      setUser(data.user);
      if (data.user) setForm((f) => ({ ...f, email: data.user.email, name: data.user.username }));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send your message.");
        setLoading(false);
        return;
      }
      setSuccess("Message sent — we'll get back to you.");
      setForm((f) => ({ ...f, message: "" }));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <NavShell user={user}>
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[420px] card p-7 mt-10">
          <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Contact Us
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Send a message and we'll get back to you.
          </p>

          {error && <div className="alert alert-error mb-4"><AlertCircle size={15} />{error}</div>}
          {success && <div className="alert alert-success mb-4"><CheckCircle2 size={15} />{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="input pl-3"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input pl-3"
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <textarea
              className="input pl-3"
              style={{ minHeight: 120, resize: "vertical", paddingTop: 10 }}
              placeholder="How can we help?"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              Send Message
            </button>
          </form>
        </div>
      </div>
    </NavShell>
  );
}