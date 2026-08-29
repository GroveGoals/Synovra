"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart, MessageCircle, Share2, Bookmark, RotateCw, Plus, X, Send,
  Loader2, Search, User as UserIcon, Image as ImageIcon,
} from "lucide-react";

function Avatar({ user, size = 40 }) {
  if (user?.avatarDataUrl) {
    return <img src={user.avatarDataUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--accent-soft)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, fontSize: size * 0.4, fontFamily: "var(--font-display)",
      }}
    >
      {user?.username?.slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

function CommentsSheet({ postId, open, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/feed/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [open, postId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/feed/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setComments((prev) => [...prev, data.comment]);
      setInput("");
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease", zIndex: 200,
        }}
      />
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, maxHeight: "70vh",
          background: "var(--surface)", borderRadius: "20px 20px 0 0",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)", zIndex: 201,
          display: "flex", flexDirection: "column",
        }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold">Comments</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-3" style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div className="flex justify-center py-8" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5 mb-3">
                <Avatar user={c.author} size={28} />
                <div>
                  <span className="text-sm font-semibold mr-1.5">{c.author.username}</span>
                  <span className="text-sm" style={{ overflowWrap: "anywhere" }}>{c.content}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <input
            className="input pl-3"
            placeholder="Add a comment…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)", color: "white", opacity: sending || !input.trim() ? 0.6 : 1 }}
            aria-label="Send comment"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </>
  );
}

function CreatePostModal({ open, onClose, onCreated }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function handlePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handlePost() {
    if (!caption.trim() && !image) {
      setError("Add a caption or an image first.");
      return;
    }
    setPosting(true);
    setError("");
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, mediaUrl: image, mediaType: "image" }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setError(data.error || "Could not post.");
      return;
    }
    onCreated(data.post);
    setCaption("");
    setImage(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="card p-4"
        style={{ width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">New Post</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="alert alert-error mb-2">{error}</div>}

        <textarea
          className="input pl-3 mb-3"
          style={{ minHeight: 80, resize: "vertical", paddingTop: 10 }}
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {image ? (
          <div style={{ position: "relative", marginBottom: 12 }}>
            <img src={image} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 300, objectFit: "cover" }} />
            <button
              onClick={() => setImage(null)}
              aria-label="Remove image"
              style={{
                position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)",
                color: "white", borderRadius: "50%", width: 28, height: 28, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 mb-3"
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "1px dashed var(--border)",
              background: "var(--surface-2)", color: "var(--text-muted)", justifyContent: "center",
            }}
          >
            <ImageIcon size={16} /> Add a photo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePick} style={{ display: "none" }} />

        <button className="btn-primary" onClick={handlePost} disabled={posting}>
          {posting ? <Loader2 size={15} className="animate-spin" /> : "Post"}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, onLike, onSave, onShare, onOpenComments }) {
  return (
    <div
      style={{
        position: "relative", height: "100%", width: "100%", flexShrink: 0,
        scrollSnapAlign: "start", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", overflow: "hidden", background: "#000",
      }}
    >
      {post.mediaUrl ? (
        <img
          src={post.mediaUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, var(--accent-soft), var(--surface-2))",
          }}
        />
      )}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 45%)",
        }}
      />

      <div className="flex items-end justify-between p-4" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "78%" }}>
          <div className="flex items-center gap-2 mb-2">
            <Avatar user={post.author} size={34} />
            <span className="text-sm font-semibold" style={{ color: "white" }}>{post.author.username}</span>
          </div>
          {post.caption && (
            <p className="text-sm" style={{ color: "white", overflowWrap: "anywhere", lineHeight: 1.4 }}>
              {post.caption}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button onClick={() => onLike(post)} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none" }} aria-label="Like">
            <Heart size={26} color="white" fill={post.likedByMe ? "#ff4d67" : "none"} stroke={post.likedByMe ? "#ff4d67" : "white"} />
            <span className="text-xs" style={{ color: "white" }}>{post.likeCount}</span>
          </button>
          <button onClick={() => onOpenComments(post)} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none" }} aria-label="Comments">
            <MessageCircle size={26} color="white" />
            <span className="text-xs" style={{ color: "white" }}>{post.commentCount}</span>
          </button>
          <button onClick={() => onShare(post)} style={{ background: "none", border: "none" }} aria-label="Share">
            <Share2 size={24} color="white" />
          </button>
          <button onClick={() => onSave(post)} style={{ background: "none", border: "none" }} aria-label="Save">
            <Bookmark size={24} color="white" fill={post.savedByMe ? "white" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);

  const loadFeed = useCallback(async (cursor) => {
    const url = cursor ? `/api/feed?cursor=${cursor}` : "/api/feed";
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) => (cursor ? [...prev, ...data.posts] : data.posts));
      setNextCursor(data.nextCursor);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFeed(null).finally(() => setLoading(false));
  }, [loadFeed]);

  async function handleRefresh() {
    setRefreshing(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    await loadFeed(null);
    setRefreshing(false);
  }

  async function handleScroll() {
    const el = scrollRef.current;
    if (!el || loadingMore || !nextCursor) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setLoadingMore(true);
      await loadFeed(nextCursor);
      setLoadingMore(false);
    }
  }

  async function handleLike(post) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    await fetch(`/api/feed/${post.id}/like`, { method: "POST" });
  }

  async function handleSave(post) {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, savedByMe: !p.savedByMe } : p)));
    await fetch(`/api/feed/${post.id}/save`, { method: "POST" });
  }

  async function handleShare(post) {
    const url = `${window.location.origin}/feed/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${post.author.username}'s post`, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  function handlePostCreated(newPost) {
    setPosts((prev) => [newPost, ...prev]);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <div
        className="flex items-center justify-between px-4"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, height: 56,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))",
        }}
      >
        <button aria-label="Profile" style={{ background: "none", border: "none", color: "white" }}>
          <UserIcon size={22} />
        </button>
        <button aria-label="Search" style={{ background: "none", border: "none", color: "white" }}>
          <Search size={22} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: "100%", color: "white" }}>
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 text-center" style={{ height: "100%", color: "white" }}>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>No posts yet — be the first to share something.</p>
          <button onClick={() => setCreateOpen(true)} className="btn-primary" style={{ maxWidth: 160 }}>
            <Plus size={14} /> Create Post
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory",
          }}
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onOpenComments={setCommentsPost}
            />
          ))}
          {loadingMore && (
            <div className="flex items-center justify-center" style={{ height: 60, color: "white" }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
        </div>
      )}

      <div
        className="flex items-center justify-center gap-4"
        style={{ position: "absolute", bottom: 20, left: 0, right: 0, zIndex: 10 }}
      >
        <button
          onClick={handleRefresh}
          aria-label="Refresh feed"
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white" }}
        >
          <RotateCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={() => setCreateOpen(true)}
          aria-label="Create post"
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent)", border: "none", color: "white" }}
        >
          <Plus size={24} />
        </button>
      </div>

      {commentsPost && (
        <CommentsSheet postId={commentsPost.id} open={!!commentsPost} onClose={() => setCommentsPost(null)} />
      )}
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handlePostCreated} />
    </div>
  );
                                                        }
