"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { PasswordRequirement, UsernameStatus } from "@/components/AuthWidgets";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uname = form.username.trim();
    if (uname.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/username-check?username=${encodeURIComponent(uname)}`);
        const data = await res.json();
        setUsernameStatus(data.status);
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [form.username]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (usernameStatus === "taken") return setError("That username is already taken.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4">
      <div className="w-full max-w-[420px] card p-7 mt-16">
        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Create your account
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Join Synovra in under a minute.
        </p>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
              Username
            </label>
            <div className="relative flex items-center">
              <User size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="yourname"
                autoComplete="username"
              />
            </div>
            {form.username.trim().length > 0 && (
              <div className="mt-1.5">
                <UsernameStatus status={usernameStatus} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
              <input
                className="input pr-9"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Create a password"
                autoComplete="new-password"
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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3" style={{ color: "var(--text-muted)" }} />
              <input
                className="input"
                type={showPw ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
            {form.confirm.length > 0 && (
              <div className="mt-1.5">
                <PasswordRequirement met={form.confirm === form.password} label="Passwords match" />
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={loading || usernameStatus === "checking" || usernameStatus === "taken"}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <div className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="btn-text">Log in</Link>
        </div>
      </div>
    </div>
  );
}