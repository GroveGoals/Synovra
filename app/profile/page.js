"use client";
import { useState, useEffect, useRef } from "react";
import { User, Loader2, AlertCircle, CheckCircle2, Camera, Trash2, RefreshCw } from "lucide-react";
import NavShell from "@/components/NavShell";
import AvatarCropper from "@/components/AvatarCropper";

const LANGUAGES = ["English", "French", "Spanish", "Arabic"];
const MAX_UPLOAD_BYTES = 1_000_000; // ~1MB before base64 overhead

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", country: "", language: "English", isPublic: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  async function loadEverything() {
    try {
      const [sessionRes, profileRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/profile"),
      ]);
      const sessionData = await sessionRes.json();
      if (!profileRes.ok) {
        throw new Error(`Profile request failed (${profileRes.status})`);
      }
      const profileData = await profileRes.json();
      setUser(sessionData.user);
      setProfile(profileData.profile);
      setForm({
        username: profileData.profile.username,
        country: profileData.profile.country || "",
        language: profileData.profile.language,
        isPublic: profileData.profile.isPublic,
      });
    } catch (err) {
      setError(`Could not load your profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    if (!loading && profile && !profile.country) {
      detectCountry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile]);

  async function detectCountry() {
    setDetectingCountry(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data?.country_name) {
        setForm((f) => ({ ...f, country: data.country_name }));
      }
    } catch {
      // Silent — country just stays unset if detection fails; user can retry.
    } finally {
      setDetectingCountry(false);
    }
  }

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

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setCropSource(dataUrl);
    e.target.value = "";
  }

  async function handleCropSave(croppedDataUrl) {
    setCropSource(null);
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: croppedDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setUploading(false);
        return;
      }
      setProfile((p) => ({ ...p, avatarDataUrl: croppedDataUrl }));
      setUser((u) => ({ ...u, avatarDataUrl: croppedDataUrl }));
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
      {cropSource && (
        <AvatarCropper
          imageSrc={cropSource}
          onCancel={() => setCropSource(null)}
          onSave={handleCropSave}
        />
      )}
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