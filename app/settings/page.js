"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, User, HelpCircle, Phone, ChevronRight } from "lucide-react";
import NavShell from "@/components/NavShell";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      });
  }, []);

  async function toggleOnline() {
    if (!user) return;
    setToggling(true);
    const nextOnline = !user.online;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: nextOnline }),
      });
      if (res.ok) setUser((u) => ({ ...u, online: nextOnline }));
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <NavShell user={user}>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={22} className="animate-spin" />
        </div>
      </NavShell>
    );
  }

  return (
    <NavShell user={user}>
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[420px] card p-7 mt-10">
          <h1 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Settings
          </h1>

          <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="text-sm font-medium">Online status</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Show others when you're active
              </div>
            </div>
            <button
              onClick={toggleOnline}
              disabled={toggling}
              className="w-11 h-6 rounded-full relative transition-colors"
              style={{ background: user?.online ? "var(--success)" : "var(--border)" }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: user?.online ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          <Link href="/profile" className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <User size={16} /> Edit Profile
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </Link>

          <Link href="/help" className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <HelpCircle size={16} /> Help Center
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </Link>

          <Link href="/contact" className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Phone size={16} /> Contact Us
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </Link>
        </div>
      </div>
    </NavShell>
  );
}