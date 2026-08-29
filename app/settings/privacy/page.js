"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2, Lock, Unlock } from "lucide-react";
import NavShell from "@/components/NavShell";

const SECTIONS = [
  {
    title: "Activity",
    items: ["Manage posts", "Content preferences", "Notifications"],
  },
  {
    title: "Account",
    items: ["Account", "Security and permissions", "Share profile"],
  },
  {
    title: "Interactions",
    items: [
      "Comments", "Mentions", "Reuse of content",
      "Display profile when sharing links", "Downloads",
      "Following list", "Liked videos", "Viewers",
    ],
  },
  {
    title: "Content & display",
    items: ["Inbox & Messaging", "Activity centre", "Ads"],
  },
];

export default function PrivacySettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  async function togglePrivateAccount() {
    const nextIsPublic = !profile.isPublic;
    setProfile((p) => ({ ...p, isPublic: nextIsPublic }));
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
    } finally {
      setSaving(false);
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
          <Link href="/settings" className="btn-text inline-flex items-center gap-1.5 mb-4">
            <ArrowLeft size={14} /> Settings
          </Link>
          <h1 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Privacy
          </h1>

          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Visibility
          </h2>
          <div className="card p-2 mb-6">
            <button
              onClick={togglePrivateAccount}
              disabled={saving}
              className="flex items-center justify-between w-full p-3 rounded-xl"
              style={{ background: "none", border: "none", textAlign: "left" }}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                {profile?.isPublic ? <Unlock size={16} /> : <Lock size={16} />}
                Private account
              </div>
              <div
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: !profile?.isPublic ? "var(--accent)" : "var(--border)" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: !profile?.isPublic ? "translateX(22px)" : "translateX(2px)" }}
                />
              </div>
            </button>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                {section.title}
              </h2>
              <div className="card p-2">
                {section.items.map((item, i, arr) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-3"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", color: "var(--text-muted)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{item}</span>
                    <ChevronRight size={16} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </NavShell>
  );
}