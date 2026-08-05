"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PasswordRequirement } from "@/components/AuthWidgets";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed.");
        setLoading(false);
        return;
      }
      setSuccess("Password reset. Redirecting to login…");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4">
      <div className="w-full max-w-[420px] card p-7 mt-16">
        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Enter reset code
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Sent to {email}, if an account exists.
        </p>

        {error && <div className="alert alert-error mb-4"><AlertCircle size={15} />{error}</div>}
        {success && <div className="alert alert-success mb-4"><CheckCircle2 size={15} />{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input pl-3 tracking-[0.2em] font-semibold"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
          />
          <div>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
              <input
                className="input pr-9"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Create a new password"
              />
              <button type="button" className="absolute right-2" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="mt-1.5">
              <PasswordRequirement met={form.password.length >= 8} label="At least 8 characters" />
            </div>
          </div>
          <div>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
              <input
                className="input"
                type={showPw ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat new password"
              />
            </div>
            {form.confirm.length > 0 && (
              <div className="mt-1.5">
                <PasswordRequirement met={form.confirm === form.password} label="Passwords match" />
              </div>
            )}
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin" />}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}