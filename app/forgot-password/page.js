"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4">
      <div className="w-full max-w-[420px] card p-7 mt-16">
        <Link href="/login" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> Back to login
        </Link>
        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Reset your password
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          We&apos;ll email you a reset code if an account exists.
        </p>

        {error && <div className="alert alert-error mb-4"><AlertCircle size={15} />{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center">
            <Mail size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin" />}
            Send Reset Code
          </button>
        </form>
      </div>
    </div>
  );
}