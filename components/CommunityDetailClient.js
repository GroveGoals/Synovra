"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, Users, Loader2, Heart, MessageCircle, Trash2, Send, AlertCircle,
  UserPlus, Link2, X as XIcon, Hash, Plus, Settings, ChevronLeft, ChevronDown,
  Image as ImageIcon, Shield, ShieldOff, Calendar, ZoomIn,
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

function CropModal({ image, aspect, shape, onCancel, onConfirm }) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const dragRef = useRef(null);
  const frameRef = useRef(null);

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origPos: pos };
  }
  function handlePointerMove(e) {
    if (!dragRef.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width;
    const dy = (e.clientY - dragRef.current.startY) / rect.height;
    setPos({
      x: Math.min(1, Math.max(0, dragRef.current.origPos.x - dx)),
      y: Math.min(1, Math.max(0, dragRef.current.origPos.y - dy)),
    });
  }
  function handlePointerUp() {
    dragRef.current = null;
  }

  function confirm() {
    const img = new window.Image();
    img.onload = () => {
      const outW = aspect >= 1 ? 800 : 400;
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");

      const scale = Math.max(outW / img.width, outH / img.height) * zoom;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = outW / 2 - pos.x * drawW;
      const drawY = outH / 2 - pos.y * drawH;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      onConfirm(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = image;
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div className="card p-4" style={{ maxWidth: 380, width: "100%" }}>
        <h3 className="text-sm font-semibold mb-3">Adjust image</h3>
        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: "100%",
            aspectRatio: aspect,
            borderRadius: shape === "circle" ? "50%" : 12,
            overflow: "hidden",
            position: "relative",
            background: "var(--surface-2)",
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <img
            src={image}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              top: `${pos.y * 100}%`,
              left: `${pos.x * 100}%`,
              transform: `translate(-50%, -50%) scale(${zoom})`,
              minWidth: "100%",
              minHeight: "100%",
              width: "auto",
              height: "auto",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <ZoomIn size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={confirm} className="btn-primary">Apply</button>
          <button onClick={onCancel} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityDetailClient({ communityId, currentUserId }) {
  const router = useRouter();
  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);

  const [community, setCommunity] = useState(null);
  const [sections, setSections] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [postsLoading, setPostsLoading] = useState(false);
  const [channelListOpen, setChannelListOpen] = useState(false);

  const [view, setView] = useState("feed");

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
  const [newChannelSection, setNewChannelSection] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");

  const [cropTarget, setCropTarget] = useState(null);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState("");

  const canManage = community && (community.isOwner || community.isAdmin);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cRes, chRes, secRes] = await Promise.all([
        fetch(`/api/communities/${communityId}`),
        fetch(`/api/communities/${communityId}/channels`),
        fetch(`/api/communities/${communityId}/sections`),
      ]);
      const cData = await cRes.json();

      if (!cRes.ok) {
        setLoadError(cData.error || `Failed to load community (${cRes.status})`);
        setCommunity(null);
        setLoading(false);
        return;
      }

      const chData = await chRes.json();
      const secData = await secRes.json();
      const loadedChannels = chRes.ok ? (chData.channels || []) : [];
      const loadedSections = secRes.ok ? (secData.sections || []) : [];

      setCommunity(cData.community || null);
      setSettingsName(cData.community?.name || "");
      setSettingsDescription(cData.community?.description || "");
      setChannels(loadedChannels);
      setSections(loadedSections);
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
    } finally {
      setPostsLoading(false);
    }
  }, [communityId]);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/members`);
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
    } catch (err) {}
  }, [communityId]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/events`);
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
    } catch (err) {}
  }, [communityId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeChannelId) loadPosts(activeChannelId); }, [activeChannelId, loadPosts]);
  useEffect(() => { if (view === "members") loadMembers(); }, [view, loadMembers]);
  useEffect(() => { if (view === "events") loadEvents(); }, [view, loadEvents]);

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

  async function handleCreateSection(e) {
    e.preventDefault();
    const name = newSectionName.trim();
    if (!name) return;
    setCreatingSection(true);
    const res = await fetch(`/api/communities/${communityId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setCreatingSection(false);
    if (res.ok) {
      setSections((prev) => [...prev, data.section]);
      setNewSectionName("");
    }
  }

  async function handleDeleteSection(section) {
    if (!window.confirm(`Delete section "${section.name}"? Channels inside will become uncategorized.`)) return;
    await fetch(`/api/communities/${communityId}/sections/${section.id}`, { method: "DELETE" });
    setSections((prev) => prev.filter((s) => s.id !== section.id));
    setChannels((prev) => prev.map((c) => (c.sectionId === section.id ? { ...c, sectionId: null } : c)));
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
      body: JSON.stringify({ name, sectionId: newChannelSection || null }),
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

  function pickImage(target) {
    const input = target === "banner" ? bannerInputRef.current : iconInputRef.current;
    input?.click();
  }

  function handleImageFileChange(e, target) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropTarget({ type: target, image: reader.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCropConfirm(dataUrl) {
    const field = cropTarget.type === "banner" ? "bannerDataUrl" : "iconDataUrl";
    setCropTarget(null);
    setSavingSettings(true);
    const res = await fetch(`/api/communities/${communityId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: dataUrl }),
    });
    setSavingSettings(false);
    if (res.ok) load();
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus("");
    const res = await fetch(`/api/communities/${communityId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: settingsName, description: settingsDescription }),
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

  async function handleCreateEvent(e) {
    e.preventDefault();
    const title = newEventTitle.trim();
    if (!title || !newEventTime) return;
    setEventError("");
    setCreatingEvent(true);
    const res = await fetch(`/api/communities/${communityId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: newEventDesc, startTime: newEventTime }),
    });
    const data = await res.json();
    setCreatingEvent(false);
    if (!res.ok) {
      setEventError(data.error || "Could not create event.");
      return;
    }
    setNewEventTitle("");
    setNewEventTime("");
    setNewEventDesc("");
    setEvents((prev) => [...prev, data.event].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
  }

  async function handleRsvp(event) {
    const res = await fetch(`/api/events/${event.id}/rsvp`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, isAttending: data.isAttending, attendeeCount: data.attendeeCount } : e))
      );
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

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const uncategorized = channels.filter((c) => !c.sectionId || !sections.find((s) => s.id === c.sectionId));

  return (
    <div>
      {cropTarget && (
        <CropModal
          image={cropTarget.image}
          aspect={cropTarget.type === "banner" ? 3 : 1}
          shape={cropTarget.type === "icon" ? "circle" : "square"}
          onCancel={() => setCropTarget(null)}
          onConfirm={handleCropConfirm}
        />
      )}
      <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, "banner")} style={{ display: "none" }} />
      <input ref={iconInputRef} type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, "icon")} style={{ display: "none" }} />

      <div className="mb-4" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div
          onClick={() => canManage && pickImage("banner")}
          style={{
            height: 110,
            cursor: canManage ? "pointer" : "default",
            background: community.bannerDataUrl
              ? `url(${community.bannerDataUrl}) center/cover`
              : "linear-gradient(135deg, var(--accent-soft), var(--surface-2))",
            position: "relative",
          }}
        >
          {canManage && (
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
              <ImageIcon size={12} color="white" />
              <span style={{ fontSize: 11, color: "white" }}>{community.bannerDataUrl ? "Change" : "Add banner"}</span>
            </div>
          )}
        </div>
        <div className="card p-4" style={{ borderRadius: 0, borderTop: "none", marginTop: -1 }}>
          <div className="flex items-center gap-3 mb-3">
            <div onClick={() => canManage && pickImage("icon")} style={{ cursor: canManage ? "pointer" : "default", position: "relative" }}>
              <Avatar user={{ username: community.name, avatarDataUrl: community.iconDataUrl }} size={52} />
              {canManage && (
                <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--accent)", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon size={10} color="white" />
                </div>
              )}
            </div>
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
            <button
              onClick={() => setView(view === "events" ? "feed" : "events")}
              aria-label="Events"
              style={{ color: "var(--text-muted)", background: "var(--surface-2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Calendar size={16} />
            </button>
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
          {inviteStatus && <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{inviteStatus}</div>}

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
            {members.length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>No members loaded yet.</p>}
          </div>
        </div>
      )}

      {view === "events" && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setView("feed")} aria-label="Back" style={{ background: "none", border: "none", color: "var(--text-muted)" }}>
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm font-semibold">Events</h2>
          </div>

          {community.isMember && (
            <form onSubmit={handleCreateEvent} className="space-y-2 mb-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              {eventError && <div className="text-xs" style={{ color: "var(--danger, #e55)" }}>{eventError}</div>}
              <input
                className="input pl-3"
                style={{ fontSize: 13 }}
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
              <input
                className="input pl-3"
                style={{ fontSize: 13 }}
                type="datetime-local"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
              />
              <input
                className="input pl-3"
                style={{ fontSize: 13 }}
                placeholder="Description (optional)"
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={creatingEvent || !newEventTitle.trim() || !newEventTime}>
                {creatingEvent ? <Loader2 size={14} className="animate-spin" /> : "Create Event"}
              </button>
            </form>
          )}

          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="card p-3">
                <div className="text-sm font-semibold">{ev.title}</div>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(ev.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
                {ev.description && <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{ev.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{ev.attendeeCount} going</span>
                  <button
                    onClick={() => handleRsvp(ev)}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={ev.isAttending ? { background: "var(--surface-2)", color: "var(--text)" } : { background: "var(--accent)", color: "white" }}
                  >
                    {ev.isAttending ? "Going" : "RSVP"}
                  </button>
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No events yet.</p>}
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
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Name</label>
              <input className="input pl-3 mt-1" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Description</label>
              <input className="input pl-3 mt-1" value={settingsDescription} onChange={(e) => setSettingsDescription(e.target.value)} />
            </div>
            {settingsStatus && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{settingsStatus}</div>}
            <button type="submit" className="btn-primary" disabled={savingSettings}>
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : "Save Settings"}
            </button>
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Sections</h3>
            <div className="space-y-1 mb-2">
              {sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1">
                  <span>{s.name}</span>
                  <button onClick={() => handleDeleteSection(s)} style={{ background: "none", border: "none", color: "var(--text-muted)" }} aria-label={`Delete section ${s.name}`}>
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateSection} className="flex items-center gap-2 mb-4">
              <input
                className="input pl-3"
                style={{ padding: "8px 10px", fontSize: 13 }}
                placeholder="New section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ maxWidth: 90 }} disabled={creatingSection || !newSectionName.trim()}>
                {creatingSection ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add</>}
              </button>
            </form>

            <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Channels</h3>
            <div className="space-y-1 mb-3">
              {channels.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-1">
                    <Hash size={13} /> {c.name}
                    {c.sectionId && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        · {sections.find((s) => s.id === c.sectionId)?.name}
                      </span>
                    )}
                  </span>
                  {channels.length > 1 && (
                    <button onClick={() => handleDeleteChannel(c)} style={{ background: "none", border: "none", color: "var(--text-muted)" }} aria-label={`Delete #${c.name}`}>
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateChannel} className="space-y-2">
              {channelError && <div className="text-xs" style={{ color: "var(--danger, #e55)" }}>{channelError}</div>}
              <input
                className="input pl-3"
                style={{ padding: "8px 10px", fontSize: 13 }}
                placeholder="new-channel-name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              {sections.length > 0 && (
                <select
                  className="input pl-3"
                  style={{ padding: "8px 10px", fontSize: 13 }}
                  value={newChannelSection}
                  onChange={(e) => setNewChannelSection(e.target.value)}
                >
                  <option value="">No section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <button type="submit" className="btn-primary" disabled={creatingChannel || !newChannelName.trim()}>
                {creatingChannel ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add Channel</>}
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
          <div className="card p-3 mb-4">
            <button
              onClick={() => setChannelListOpen((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-semibold"
              style={{ background: "none", border: "none", color: "var(--text)" }}
            >
              <span className="flex items-center gap-2">
                <Hash size={14} /> {activeChannel ? activeChannel.name : "Select a channel"}
              </span>
              <ChevronDown size={16} style={{ transform: channelListOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>

            {channelListOpen && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                {sections.map((s) => {
                  const secChannels = channels.filter((c) => c.sectionId === s.id);
                  if (secChannels.length === 0) return null;
                  return (
                    <div key={s.id} className="mb-2">
                      <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{s.name}</div>
                      {secChannels.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setActiveChannelId(c.id); setChannelListOpen(false); }}
                          className="flex items-center gap-2 w-full text-sm py-1.5 px-2 rounded-lg"
                          style={{
                            background: activeChannelId === c.id ? "var(--accent-soft)" : "transparent",
                            color: activeChannelId === c.id ? "var(--accent)" : "var(--text)",
                            border: "none", textAlign: "left",
                          }}
                        >
                          <Hash size={13} /> {c.name}
                        </button>
                      ))}
                    </div>
                  );
                })}
                {uncategorized.length > 0 && (
                  <div>
                    {sections.length > 0 && <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Other</div>}
                    {uncategorized.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveChannelId(c.id); setChannelListOpen(false); }}
                        className="flex items-center gap-2 w-full text-sm py-1.5 px-2 rounded-lg"
                        style={{
                          background: activeChannelId === c.id ? "var(--accent-soft)" : "transparent",
                          color: activeChannelId === c.id ? "var(--accent)" : "var(--text)",
                          border: "none", textAlign: "left",
                        }}
                      >
                        <Hash size={13} /> {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {channels.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No channels yet.{canManage ? " Add one from Settings." : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {postsLoading ? (
            <div className="flex justify-center py-10" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 mb-4">
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

          {community.isMember && activeChannel && (
            <form onSubmit={handlePost} className="flex items-center gap-2" style={{ position: "sticky", bottom: 12 }}>
              {error && (
                <div className="alert alert-error" style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 8 }}>
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <input
                className="input pl-4"
                style={{
                  flex: 1, borderRadius: 999, height: 46,
                  background: "var(--surface)", border: "1px solid var(--border)",
                }}
                placeholder={`Message #${activeChannel.name}`}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={posting || !newPost.trim()}
                style={{
                  width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                  background: "var(--accent)", color: "white", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: posting || !newPost.trim() ? 0.5 : 1,
                }}
              >
                {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}