"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Users, ChevronLeft } from "lucide-react";

function CommunityIcon({ community, size = 64 }) {
  if (community?.iconDataUrl) {
    return (
      <img
        src={community.iconDataUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
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
      {community?.name?.slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

export default function InviteLandingClient({ code: codeProp } = {}) {
  const router = useRouter();
  const params = useParams();
  const code = codeProp || params?.code;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [community, setCommunity] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "This invite is invalid.");
        setLoading(false);
        return;
      }
      setStatus(data.status);
      setCommunity(data.community);
      setAlreadyMember(data.alreadyMember);
    } catch (err) {
      setError("Network error loading invite.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { if (code) load(); }, [code, load]);

  async function handleJoin() {
    setJoinError("");
    setJoining(true);
    const res = await fetch(`/api/invites/${code}`, { method: "POST" });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) {
      setJoinError(data.error || "Could not join this community.");
      return;
    }
    router.push(`/communities/${data.community.id}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
        <button
          onClick={() => router.push("/communities")}
          className="flex items-center gap-1 text-sm mb-4"
          style={{ background: "none", border: "none", color: "var(--text-muted)" }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="card p-5 text-center">
          <p className="text-sm font-semibold mb-1">This invite isn't valid</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {error || "It may have expired, been revoked, or reached its use limit."}
          </p>
        </div>
      </div>
    );
  }

  const statusLabel =
    status === "expired" ? "This invite has expired." :
    status === "exhausted" ? "This invite has reached its use limit." :
    null;

  return (
    <div className="p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/communities")}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ background: "none", border: "none", color: "var(--text-muted)" }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-4" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div
          style={{
            height: 90,
            background: community.bannerDataUrl
              ? `url("${community.bannerDataUrl}") center/cover`
              : "linear-gradient(135deg, var(--accent-soft), var(--surface-2))",
          }}
        />
        <div className="card p-4" style={{ borderRadius: 0, borderTop: "none", marginTop: -1, textAlign: "center" }}>
          <div style={{ marginTop: -46, marginBottom: 10 }}>
            <CommunityIcon community={community} size={64} />
          </div>
          <h1 className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            You've been invited to join
          </h1>
          <h2 className="text-xl font-bold mb-2">{community.name}</h2>
          {community.description && (
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{community.description}</p>
          )}
          <div className="flex items-center justify-center gap-1 text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            <Users size={13} /> {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
          </div>

          {statusLabel ? (
            <p className="text-xs" style={{ color: "var(--danger, #e55)" }}>{statusLabel}</p>
          ) : alreadyMember ? (
            <button onClick={() => router.push(`/communities/${community.id}`)} className="btn-primary">
              You're already a member — Open community
            </button>
          ) : (
            <>
              {joinError && <div className="text-xs mb-2" style={{ color: "var(--danger, #e55)" }}>{joinError}</div>}
              <button onClick={handleJoin} className="btn-primary" disabled={joining}>
                {joining ? <Loader2 size={14} className="animate-spin" /> : "Join Community"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
