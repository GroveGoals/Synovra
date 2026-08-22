"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, AlertCircle, Check } from "lucide-react";

function Avatar({ name, iconDataUrl, size = 64 }) {
  if (iconDataUrl) {
    return <img src={iconDataUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "var(--accent-soft)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size * 0.4,
      }}
    >
      {name?.slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

export default function InviteLandingClient({ code }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invalidReason, setInvalidReason] = useState(null);
  const [community, setCommunity] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "This invite link is invalid.");
        setLoading(false);
        return;
      }
      setCommunity(data.community);
      setInvalidReason(data.valid ? null : data.reason);
    } catch (err) {
      setError("Network error loading this invite.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin() {
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${code}/join`, { method: "POST" });
      const data = await res.json();
      setJoining(false);
      if (!res.ok) {
        setError(data.error || "Could not join this community.");
        return;
      }
      setJoined(true);
      setTimeout(() => router.push(`/communities/${data.communityId}`), 800);
    } catch (err) {
      setJoining(false);
      setError("Network error joining this community.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (error && !community) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={28} style={{ color: "var(--danger, #e55)", margin: "0 auto 12px" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          height: 110,
          background: community.bannerDataUrl
            ? `url("${community.bannerDataUrl}") center/cover`
            : "linear-gradient(135deg, var(--accent-soft), var(--surface-2))",
        }}
      />
      <div className="p-5" style={{ marginTop: -40 }}>
        <div style={{ border: "4px solid var(--surface)", borderRadius: "50%", width: 76, height: 76, overflow: "hidden", marginBottom: 12 }}>
          <Avatar name={community.name} iconDataUrl={community.iconDataUrl} size={68} />
        </div>
        <h1 className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          {community.name}
        </h1>
        {community.description && (
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{community.description}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          <Users size={13} /> {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
        </div>

        {joined ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
            <Check size={16} /> You&apos;re in! Taking you there…
          </div>
        ) : invalidReason === "expired" ? (
          <div className="alert alert-error">This invite link has expired.</div>
        ) : invalidReason === "maxed_out" ? (
          <div className="alert alert-error">This invite link has reached its use limit.</div>
        ) : community.isMember ? (
          <button onClick={() => router.push(`/communities/${community.id}`)} className="btn-primary">
            Go to Community
          </button>
        ) : (
          <>
            {error && <div className="alert alert-error mb-2"><AlertCircle size={14} />{error}</div>}
            <button onClick={handleJoin} className="btn-primary" disabled={joining}>
              {joining ? <Loader2 size={15} className="animate-spin" /> : "Join Community"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}