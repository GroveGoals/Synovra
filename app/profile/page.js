"use client";
import { useState, useEffect, useRef } from "react";
import { User, Loader2, AlertCircle, CheckCircle2, Camera, Trash2 } from "lucide-react";
import NavShell from "@/components/NavShell";

const LANGUAGES = ["English", "French", "Spanish", "Arabic"];
const MAX_UPLOAD_BYTES = 1_000_000;

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", country: "", language: "English", isPublic: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  async function loadEverything() {
    const [sessionRes, profileRes] = await Promise.all([
      fetch("/api/auth/session"),
      fetch("/api/profile"),
    ]);
    const sessionData = await sessionRes.json();
    const profileData = await profileRes.json();
    setUser(sessionData.user);
    setProfile(profileData.profile);
    setForm({
      username: profileData.profile.username,
      country: profileData.profile.country || "",
      language: profileData.profile.language,
      isPublic: profileData.profile.isPublic,
    });
    setLoading(false);
  }

  useEffect(() => {
    loadEverything();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save changes.");
        setSaving(false);
        return;
      }
      setProfile(data.profile);
      setSuccess("Profile updated.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large — please choose one under 1MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setUploading(false);
        return;
      }
      setProfile((p) => ({ ...p, avatarDataUrl: dataUrl }));
      setUser((u) => ({ ...u, avatarDataUrl: dataUrl }));
      setSuccess("Profile picture updated.");
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove photo.");
        return;
      }
      setProfile((p) => ({ ...p, avatarDataUrl: null }));
      setUser((u) => ({ ...u, avatarDataUrl: null }));
    } catch {
      setError("Network error. Please try again.");
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
          <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            My Profile
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {profile?.email}
          </p>

          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {profile?.avatarDataUrl ? (
                <img
                  src={profile.avatarDataUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                  style={{ boxShadow: "0 0 0 3px var(--border)" }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "var(--font-display)" }}
                >
                  {profile?.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent)", color: "white" }}
                aria-label="Upload photo"
                disabled={uploading}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
            {profile?.avatarDataUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="btn-ghost inline-flex items-center gap-1.5 mt-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <Trash2 size={12} /> Remove photo
              </button>
            )}
          </div>

          {error && <div className="alert alert-error mb-4"><AlertCircle size={15} />{error}</div>}
          {success && <div className="alert alert-success mb-4"><CheckCircle2 size={15} />{success}</div>}

          <form onSubmit={handleSave} className="space-y-4">
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
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                Country
              </label>
              <input
                className="input pl-3"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="e.g. Nigeria"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                Language
              </label>
              <select
                className="input pl-3"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm font-medium">Public profile</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Anyone can view your profile if enabled
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: form.isPublic ? "var(--accent)" : "var(--border)" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: form.isPublic ? "translateX(22px)" : "translateX(2px)" }}
                />
              </button>
            </div>

            <button className="btn-primary" type="submit" disabled={saving}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </NavShell>
  );
}