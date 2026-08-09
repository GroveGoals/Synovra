"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2, User, HelpCircle, Phone, ChevronRight,
  Mail, ShieldCheck, Calendar, Globe, Languages, Lock, Unlock,
} from "lucide-react";
import NavShell from "@/components/NavShell";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]).then(([sessionData, profileData]) => {
      setUser(sessionData.user);
      setProfile(profileData.profile);
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
      if (res.ok) {
        setUser((u) => ({ ...u, online: nextOnline }));
        setProfile((p) => ({ ...p, online: nextOnline }));
      }
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
        <div className="w-full max-w-[420px] mt-10">
          <h1 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Settings
          </h1>

          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Account overview
          </h2>
          <div className="card p-5 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail size={15} style={{ color: "var(--text-muted)" }} />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} style={{ color: "var(--success)" }} />
                <span>Email verified</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar size={15} style={{ color: "var(--text-muted)" }} />
                <span>Member since {profile?.createdAt ? formatDate(profile.createdAt) : "—"}</span>
              </div>
              {profile?.country && (
                <div className="flex items-center gap-2.5">
                  <Globe size={15} style={{ color: "var(--text-muted)" }} />
                  <span>{profile.country}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Languages size={15} style={{ color: "var(--text-muted)" }} />
                <span>{profile?.language}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {profile?.isPublic ? (
                  <Unlock size={15} style={{ color: "var(--text-muted)" }} />
                ) : (
                  <Lock size={15} style={{ color: "var(--text-muted)" }} />
                )}
                <span>{profile?.isPublic ? "Public profile" : "Private profile"}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14, marginBottom: 6 }}>
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

            <Link href="/contact" className="flex items-center justify-between py-3" style={{ paddingBottom: 0 }}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone size={16} /> Contact Us
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
            </Link>
          </div>
        </div>
      </div>
    </NavShell>
  );
}