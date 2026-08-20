"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, Users, Loader2, Heart, MessageCircle, Trash2, Send, AlertCircle,
  UserPlus, Link2, X as XIcon, Hash, Plus, Settings, ChevronLeft, Image as ImageIcon,
  Shield, ShieldOff,
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
  const bannerInputRef = useRef(null);

  const [community, setCommunity] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [postsLoading, setPostsLoading] = useState(false);

  const [view, setView] = useState("feed"); // "feed" | "members" | "settings"

  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviting, setInviting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [newChannelName, setNewChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");

  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsBanner, setSettingsBanner] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");

  const canManage = community && (community.isOwner || community.isAdmin);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cRes, chRes] = await Promise.all([
        fetch(`/api/communities/${communityId}`),
        fetch(`/api/communities/${communityId}/channels`),
      ]);
      const cData = await cRes.json();

      if (!cRes.ok) {
        setLoadError(cData.error || `Failed to load community (${cRes.status})`);
        setCommunity(null);
        setLoading(false);
        return;
      }

      const chData = await chRes.json();
      const loadedChannels = chRes.ok ? (chData.channels || []) : [];

      setCommunity(cData.community || null);
      setSettingsName(cData.community?.name || "");
      setSettingsDescription(cData.community?.description || "");
      setSettingsBanner(cData.community?.bannerDataUrl || "");
      setChannels(loadedChannels);
      setActiveChannelId((prev) => prev || loadedChannels[0]?.id || null);
    } catch (err) {
      setLoadError("Network error loading community.");
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const loadPosts = useCallback(async (channelId) => {
    setPostsLoading(true);
    try {
      const url = channelId
        ? `/api/communities/${communityId}/posts?channelId=${channelId}`
        : `/api/communities/${communityId}/posts`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
    } catch (err) {
      // leave posts as-is on failure
    } finally {
      setPostsLoading(false);
    }
  }, [communityId]);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/members`);
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
    } catch (err) {
      // silent fail
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeChannelId) loadPosts(activeChannelId);
  }, [activeChannelId, loadPosts]);

  useEffect(() => {
    if (view === "members") loadMembers();
  }, [view, loadMembers]);

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
    if (!content || !activeChannelId) return;
    setError("");
    setPosting(true);
    const res = await fetch(`/api/communities/${communityId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, channelId: activeChannelId }),
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

  async function handleInvite(e) {
    e.preventDefault();
    const username = inviteUsername.trim();
    if (!username) return;
    setInviteStatus("");
    setInviting(true);
    const res = await fetch(`/api/communities/${communityId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) {
      setInviteStatus(data.error || "Could not invite that user.");
      return;
    }
    setInviteStatus(`Added @${data.username}.`);
    setInviteUsername("");
    loadMembers();
    load();
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm("Remove this member from the community?")) return;
    await fetch(`/api/communities/${communityId}/members/${memberId}`, { method: "DELETE" });
    loadMembers();
    load();
  }

  async function handleToggleAdmin(member) {
    const current = community.adminIds || [];
    const nextAdmins = current.includes(member.id)
      ? current.filter((id) => id !== member.id)
      : [...current, member.id];

    await fetch(`/api/communities/${communityId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminIds: nextAdmins }),
    });
    load();
    loadMembers();
  }

  function handleCopyLink() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  async function handleCreateChannel(e) {
    e.preventDefault();
    const name = newChannelName.trim();
    if (!name) return;
    setChannelError("");
    setCreatingChannel(true);
    const res = await fetch(`/api/communities/${communityId}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setCreatingChannel(false);
    if (!res.ok) {
      setChannelError(data.error || "Could not create channel.");
      return;
    }
    setNewChannelName("");
    setChannels((prev) => [...prev, data.channel]);
    setActiveChannelId(data.channel.id);
    setView("feed");
  }

  async function handleDeleteChannel(channel) {
    if (!window.confirm(`Delete #${channel.name}? All posts in it will be deleted.`)) return;
    await fetch(`/api/communities/${communityId}/channels/${channel.id}`, { method: "DELETE" });
    const remaining = channels.filter((c) => c.id !== channel.id);
    setChannels(remaining);
    if (activeChannelId === channel.id) {
      setActiveChannelId(remaining[0]?.id || null);
    }
  }

  function handleBannerFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettingsBanner(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus("");
    const res = await fetch(`/api/communities/${communityId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: settingsName,
        description: settingsDescription,
        bannerDataUrl: settingsBanner,
      }),
    });
    const data = await res.json();
    setSavingSettings(false);
    if (!res.ok) {
      setSettingsStatus(data.error || "Could not save settings.");
      return;
    }
    setSettingsStatus("Saved.");
    load();
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

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <div>
      <div
        className="mb-4"
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            height: 120,
            background: community.bannerDataUrl
              ? `url(${community.bannerDataUrl}) center/cover`
              : "linear-gradient(135deg, var(--accent-soft), var(--surface-2))",
          }}
        />
        <div className="card p-4" style={{ borderRadius: 0, borderTop: "none", marginTop: -1 }}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar user={{ username: community.name, avatarDataUrl: community.iconDataUrl }} size={52} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>{community.name}</h1>
                {community.isOwner && <Crown size={14} style={{ color: "#F0B75E" }} />}
              </div>
              <button
                onClick={() => setView(view === "members" ? "feed" : "members")}
                className="text-xs flex items-center gap-1"
                style={{ color: "var(--text-muted)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <Users size={12} /> {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
              </button>
            </div>
            {canManage && (
              <button
                onClick={() => setView(view === "settings" ? "feed" : "settings")}
                aria-label="Community settings"
                style={{ color: "var(--text-muted)", background: "var(--surface-2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Settings size={16} />
              </button>
            )}
          </div>
          {community.description && <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{community.description}</p>}
          <div className="flex gap-2 flex-wrap">
            {!community.isOwner && (
              <button
                onClick={toggleMembership}
                className="btn-primary"
                style={community.isMember ? { background: "var(--surface-2)", color: "var(--text)" } : {}}
              >
                {community.isMember ? "Leave" : "Join"}
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="btn-primary"
              style={{ background: "var(--surface-2)", color: "var(--text)", maxWidth: 180 }}
            >
              <Link2 size={14} /> {linkCopied ? "Link copied!" : "Copy invite link"}
            </button>
          </div>
        </div>
      </div>

      {view === "members" && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setView("feed")} aria-label="Back" style={{ background: "none", border: "none", color: "var(--text-muted)" }}>
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm font-semibold">Members</h2>
          </div>

          {canManage && (
            <form onSubmit={handleInvite} className="flex items-center gap-2 mb-3">
              <input
                className="input pl-3"
                style={{ padding: "8px 10px", fontSize: 13 }}
                placeholder="Invite by username…"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ maxWidth: 100 }} disabled={inviting || !inviteUsername.trim()}>
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Invite</>}
              </button>
            </form>
          )}
          {inviteStatus && (
            <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{inviteStatus}</div>
          )}

          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar user={m} size={28} />
                  <span className="text-sm">{m.username}</span>
                  {m.isOwner && <Crown size={12} style={{ color: "#F0B75E" }} />}
                  {!m.isOwner && community.adminIds?.includes(m.id) && (
                    <span className="text-xs" style={{ color: "var(--accent)" }}>Admin</span>
                  )}
                </div>
                {community.isOwner && !m.isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAdmin(m)}
                      aria-label={community.adminIds?.includes(m.id) ? `Remove admin from ${m.username}` : `Make ${m.username} admin`}
                      style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {community.adminIds?.includes(m.id) ? <ShieldOff size={15} /> : <Shield size={15} />}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      aria-label={`Remove ${m.username}`}
                      style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <XIcon size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No members loaded yet.</p>
            )}
          </div>
        </div>
      )}

      {view === "settings" && canManage && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setView("feed")} aria-label="Back" style={{ background: "none", border: "none", color: "var(--text-muted)" }}>
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm font-semibold">Community Settings</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Banner</label>
              <div
                onClick={() => bannerInputRef.current?.click()}
                style={{
                  height: 90, borderRadius: 12, marginTop: 6, cursor: "pointer",
                  background: settingsBanner
                    ? `url(${settingsBanner}) center/cover`
                    : "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px dashed var(--border)",
                }}
              >
                {!settingsBanner && <ImageIcon size={20} style={{ color: "var(--text-muted)" }} />}
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerFileChange} style={{ display: "none" }} />
            </div>

            <div>
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Name</label>
              <input
                className="input pl-3 mt-1"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Description</label>
              <input
                className="input pl-3 mt-1"
                value={settingsDescription}
                onChange={(e) => setSettingsDescription(e.target.value)}
              />
            </div>

            {settingsStatus && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{settingsStatus}</div>}

            <button type="submit" className="btn-primary" disabled={savingSettings}>
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : "Save Settings"}
            </button>
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Channels</h3>
            <div className="space-y-1 mb-3">
              {channels.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-1"><Hash size={13} /> {c.name}</span>
                  {channels.length > 1 && (
                    <button onClick={() => handleDeleteChannel(c)} style={{ background: "none", border: "none", color: "var(--text-muted)" }} aria-label={`Delete #${c.name}`}>
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateChannel} className="flex items-center gap-2">
              {channelError && <div className="text-xs" style={{ color: "var(--danger, #e55)" }}>{channelError}</div>}
              <input
                className="input pl-3"
                style={{ padding: "8px 10px", fontSize: 13 }}
                placeholder="new-channel-name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ maxWidth: 90 }} disabled={creatingChannel || !newChannelName.trim()}>
                {creatingChannel ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add</>}
              </button>
            </form>

            {community.isOwner && (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <button onClick={handleDeleteCommunity} className="btn-primary" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                  <Trash2 size={14} /> Delete Community
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "feed" && (
        <>
          <div className="flex items-center gap-2 mb-4" style={{ overflowX: "auto", paddingBottom: 4 }}>
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                style={
                  activeChannelId === c.id
                    ? { background: "var(--accent)", color: "white" }
                    : { background: "var(--surface-2)", color: "var(--text-muted)" }
                }
              >
                <Hash size={12} /> {c.name}
              </button>
            ))}
            {channels.length === 0 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>No channels yet.</span>
            )}
          </div>

          {community.isMember && activeChannel && (
            <form onSubmit={handlePost} className="card p-4 mb-5">
              {error && <div className="alert alert-error mb-2"><AlertCircle size={14} />{error}</div>}
              <textarea
                className="input pl-3"
                style={{ minHeight: 70, resize: "vertical", paddingTop: 10 }}
                placeholder={`Message #${activeChannel.name}…`}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <button className="btn-primary mt-2" type="submit" disabled={posting || !newPost.trim()}>
                {posting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
              </button>
            </form>
          )}

          {postsLoading ? (
            <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}