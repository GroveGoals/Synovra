"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, Users, Loader2, Heart, MessageCircle, Trash2, Send, AlertCircle,
} from "lucide-react";

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Avatar({ user, size = 32 }) {
  if (user?.avatarDataUrl) {
    return <img src={user.avatarDataUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
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
      {user?.username?.slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

export default function CommunityDetailClient({ communityId, currentUserId }) {
  const router = useRouter();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`/api/communities/${communityId}`),
        fetch(`/api/communities/${communityId}/posts`),
      ]);
      const cData = await cRes.json();

      if (!cRes.ok) {
        setLoadError(cData.error || `Failed to load community (${cRes.status})`);
        setCommunity(null);
        setLoading(false);
        return;
      }

      const pData = await pRes.json();
      if (!pRes.ok) {
        setLoadError(pData.error || `Failed to load posts (${pRes.status})`);
        setCommunity(cData.community || null);
        setPosts([]);
        setLoading(false);
        return;
      }

      setCommunity(cData.community || null);
      setPosts(pData.posts || []);
    } catch (err) {
      setLoadError("Network error loading community.");
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleMembership() {
    if (community.isMember) {
      await fetch(`/api/communities/${communityId}/membership`, { method: "DELETE" });
    } else {
      await fetch(`/api/communities/${communityId}/membership`, { method: "POST" });
    }
    load();
  }

  async function handleDeleteCommunity() {
    if (!window.confirm(`Delete "${community.name}"? This can't be undone.`)) return;
    await fetch(`/api/communities/${communityId}`, { method: "DELETE" });
    router.push("/communities");
  }

  async function handlePost(e) {
    e.preventDefault();
    const content = newPost.trim();
    if (!content) return;
    setError("");
    setPosting(true);
    const res = await fetch(`/api/communities/${communityId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setError(data.error || "Could not post.");
      return;
    }
    setNewPost("");
    setPosts((prev) => [data.post, ...prev]);
  }

  async function handleLike(post) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
  }

  async function handleDeletePost(id) {
    if (!window.confirm("Delete this post?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleAddComment(postId) {
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p))
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (loadError || !community) {
    return (
      <div className="text-sm text-center py-10" style={{ color: "var(--danger, #e55)" }}>
        {loadError || "Community not found."}
      </div>
    );
  }

  return (
    <div>
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar user={{ username: community.name, avatarDataUrl: community.iconDataUrl }} size={52} />
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>{community.name}</h1>
              {community.isOwner && <Crown size={14} style={{ color: "#F0B75E" }} />}
            </div>
            <div className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Users size={12} /> {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        {community.description && <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{community.description}</p>}
        <div className="flex gap-2">
          {!community.isOwner && (
            <button
              onClick={toggleMembership}
              className="btn-primary"
              style={community.isMember ? { background: "var(--surface-2)", color: "var(--text)" } : {}}
            >
              {community.isMember ? "Leave" : "Join"}
            </button>
          )}
          {community.isOwner && (
            <button onClick={handleDeleteCommunity} className="btn-primary" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              <Trash2 size={14} /> Delete Community
            </button>
          )}
        </div>
      </div>

      {community.isMember && (
        <form onSubmit={handlePost} className="card p-4 mb-5">
          {error && <div className="alert alert-error mb-2"><AlertCircle size={14} />{error}</div>}
          <textarea
            className="input pl-3"
            style={{ minHeight: 70, resize: "vertical", paddingTop: 10 }}
            placeholder={`Share something with ${community.name}…`}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <button className="btn-primary mt-2" type="submit" disabled={posting || !newPost.trim()}>
            {posting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No posts yet.</p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar user={post.author} />
                <div>
                  <div className="text-sm font-semibold">{post.author.username}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{relativeTime(post.createdAt)}</div>
                </div>
              </div>
              {post.author.id === currentUserId && (
                <button onClick={() => handleDeletePost(post.id)} style={{ color: "var(--text-muted)" }} aria-label="Delete post">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="text-sm mb-3" style={{ overflowWrap: "anywhere" }}>{post.content}</p>
            <div className="flex items-center gap-4">
              <button onClick={() => handleLike(post)} className="flex items-center gap-1.5 text-xs" style={{ color: post.likedByMe ? "var(--danger)" : "var(--text-muted)" }}>
                <Heart size={15} fill={post.likedByMe ? "var(--danger)" : "none"} /> {post.likeCount}
              </button>
              <button
                onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <MessageCircle size={15} /> {post.comments.length}
              </button>
            </div>

            {openComments[post.id] && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                {post.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 mb-2">
                    <Avatar user={c.author} size={26} />
                    <div className="text-xs" style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: 1 }}>
                      <span className="font-semibold">{c.author.username}</span>{" "}
                      <span style={{ color: "var(--text-muted)" }}>{c.content}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    className="input pl-3"
                    style={{ padding: "7px 10px", fontSize: 13 }}
                    placeholder="Add a comment…"
                    value={commentDrafts[post.id] || ""}
                    onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                  />
                  <button onClick={() => handleAddComment(post.id)} style={{ color: "var(--accent)" }} aria-label="Send comment">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}