"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, Play, Calendar } from "lucide-react";

function Avatar({ user, size = 88 }) {
  if (user?.avatarDataUrl) {
    return <img src={user.avatarDataUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--accent-soft)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, fontSize: size * 0.35, fontFamily: "var(--font-display)",
      }}
    >
      {user?.username?.slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

export default function PublicProfileClient({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Could not load this profile.");
          return;
        }
        setData(json);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">{error || "Profile not found."}</p>
      </div>
    );
  }

  const { profile, posts, postCount } = data;
  const canViewPosts = postCount !== null;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <Link href="/dashboard" className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="flex flex-col items-center text-center mb-6">
          <Avatar user={profile} />
          <h1 className="text-lg font-semibold mt-3" style={{ fontFamily: "var(--font-display)" }}>
            {profile.username}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <Calendar size={12} /> Joined {formatDate(profile.createdAt)}
          </div>
          {canViewPosts && (
            <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {postCount} post{postCount === 1 ? "" : "s"}
            </div>
          )}
        </div>

        {!canViewPosts ? (
          <div className="card p-6 flex flex-col items-center text-center" style={{ color: "var(--text-muted)" }}>
            <Lock size={22} className="mb-2" />
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>This account is private</p>
            <p className="text-xs mt-1">Only they can see their posts.</p>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>No posts yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                  background: "var(--surface-2)",
                }}
              >
                {post.mediaUrl ? (
                  post.mediaType === "video" ? (
                    <video src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <img src={post.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )
                ) : null}
                {post.mediaType === "video" && (
                  <Play size={16} color="white" style={{ position: "absolute", top: 6, right: 6 }} fill="white" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}