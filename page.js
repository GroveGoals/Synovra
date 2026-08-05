"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not resend code.");
      setSuccess("A new code was emailed to you.");
    } catch {
      setError("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4">
      <div className="w-full max-w-[420px] card p-7 mt-16">
        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Verify your email
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Enter the code we emailed to {email}.
        </p>

        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-3 mb-4 text-sm"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <ShieldCheck size={17} />
          Check your inbox (and spam folder) for a 6-digit code.
        </div>

        {error && <div className="alert alert-error mb-4"><AlertCircle size={15} />{error}</div>}
        {success && <div className="alert alert-success mb-4"><CheckCircle2 size={15} />{success}</div>}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            className="input pl-3 tracking-[0.2em] font-semibold"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin" />}
            Verify
          </button>
        </form>

        <div className="text-center mt-4">
          <button className="btn-text inline-flex items-center gap-1.5" onClick={handleResend} type="button">
            <RotateCcw size={13} /> Resend code
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
