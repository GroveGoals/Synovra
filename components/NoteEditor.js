"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Star, Trash2, Plus, Image as ImageIcon,
  Type, Heading1, Heading2, List, ListOrdered, CheckSquare, Minus, X as XIcon,
  Share2, MoreVertical, Copy, FileDown, Tag as TagIcon,
} from "lucide-react";
import { uid, createBlock, emptyDoc, BLOCK_TYPES } from "@/lib/blocks";

const BLOCK_MENU = [
  { type: BLOCK_TYPES.PARAGRAPH, label: "Text", icon: Type },
  { type: BLOCK_TYPES.HEADING1, label: "Heading 1", icon: Heading1 },
  { type: BLOCK_TYPES.HEADING2, label: "Heading 2", icon: Heading2 },
  { type: BLOCK_TYPES.BULLET, label: "Bullet list", icon: List },
  { type: BLOCK_TYPES.NUMBERED, label: "Numbered list", icon: ListOrdered },
  { type: BLOCK_TYPES.CHECKLIST, label: "Checklist", icon: CheckSquare },
  { type: BLOCK_TYPES.IMAGE, label: "Image", icon: ImageIcon },
  { type: BLOCK_TYPES.DIVIDER, label: "Divider", icon: Minus },
];

function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function NoteEditor({ noteId }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const pendingImageBlockId = useRef(null);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuForBlockId, setMenuForBlockId] = useState(null);

  const [coverImageDataUrl, setCoverImageDataUrl] = useState(null);
  const [subject, setSubject] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState([]);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const saveTimeout = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Could not load this note.");
        setLoading(false);
        return;
      }
      setNote(data.note);
      setTitle(data.note.title || "");
      setBlocks(Array.isArray(data.note.content) && data.note.content.length ? data.note.content : emptyDoc());
      setPinned(!!data.note.pinned);
      setCoverImageDataUrl(data.note.coverImageDataUrl || null);
      setSubject(data.note.subject || "");
      setTags(Array.isArray(data.note.tags) ? data.note.tags : []);
      setTagsInput(Array.isArray(data.note.tags) ? data.note.tags.join(", ") : "");
    } catch (err) {
      setLoadError("Network error loading note.");
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => { load(); }, [load]);

  const scheduleSave = useCallback((next) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSaving(false);
    }, 700);
  }, [noteId]);

  function buildSavePayload(overrides = {}) {
    return {
      title,
      content: blocks,
      pinned,
      coverImageDataUrl,
      subject,
      tags,
      ...overrides,
    };
  }

  function handleTitleChange(value) {
    setTitle(value);
    scheduleSave(buildSavePayload({ title: value }));
  }

  function updateBlocks(next) {
    setBlocks(next);
    scheduleSave(buildSavePayload({ content: next }));
  }

  function handleTogglePinned() {
    const next = !pinned;
    setPinned(next);
    scheduleSave(buildSavePayload({ pinned: next }));
    setMoreMenuOpen(false);
  }

  function handleSubjectChange(value) {
    setSubject(value);
    scheduleSave(buildSavePayload({ subject: value }));
  }

  function handleTagsInputChange(value) {
    setTagsInput(value);
    const nextTags = value.split(",").map((t) => t.trim()).filter(Boolean);
    setTags(nextTags);
    scheduleSave(buildSavePayload({ tags: nextTags }));
  }

  function handlePickCover() {
    coverInputRef.current?.click();
  }

  function handleCoverFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImageDataUrl(reader.result);
      scheduleSave(buildSavePayload({ coverImageDataUrl: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleRemoveCover() {
    setCoverImageDataUrl(null);
    scheduleSave(buildSavePayload({ coverImageDataUrl: null }));
  }

  function handleBlockTextChange(blockId, text) {
    updateBlocks(blocks.map((b) => (b.id === blockId ? { ...b, text } : b)));
  }

  function handleToggleCheck(blockId) {
    updateBlocks(blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b)));
  }

  function handleAddBlock(afterId, type = BLOCK_TYPES.PARAGRAPH) {
    const newBlock = createBlock(type);
    const idx = blocks.findIndex((b) => b.id === afterId);
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    updateBlocks(next);
    setMenuForBlockId(null);
    return newBlock.id;
  }

  function handleDeleteBlock(blockId) {
    if (blocks.length <= 1) {
      updateBlocks(emptyDoc());
      return;
    }
    updateBlocks(blocks.filter((b) => b.id !== blockId));
  }

  function handleChangeBlockType(blockId, newType) {
    updateBlocks(
      blocks.map((b) => {
        if (b.id !== blockId) return b;
        const fresh = createBlock(newType, { id: b.id });
        if (b.text !== undefined && fresh.text !== undefined) fresh.text = b.text;
        return fresh;
      })
    );
    setMenuForBlockId(null);
  }

  function handlePickImage(blockId) {
    pendingImageBlockId.current = blockId;
    fileInputRef.current?.click();
  }

  function handleImageFileChange(e) {
    const file = e.target.files?.[0];
    const blockId = pendingImageBlockId.current;
    if (!file || !blockId) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateBlocks(
        blocks.map((b) => (b.id === blockId ? { ...b, dataUrl: reader.result, name: file.name } : b))
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDeleteNote() {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push("/notes");
  }

  function blockToPlainText(block) {
    if (block.type === BLOCK_TYPES.DIVIDER) return "---";
    if (block.type === BLOCK_TYPES.IMAGE) return block.name ? `[Image: ${block.name}]` : "[Image]";
    if (block.type === BLOCK_TYPES.CHECKLIST) return `${block.checked ? "[x]" : "[ ]"} ${block.text || ""}`;
    if (block.type === BLOCK_TYPES.BULLET) return `• ${block.text || ""}`;
    return block.text || "";
  }

  function noteAsPlainText() {
    const lines = [title || "Untitled", ""];
    blocks.forEach((b) => lines.push(blockToPlainText(b)));
    return lines.join("\n");
  }

  async function handleShare() {
    const text = noteAsPlainText();
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Untitled note", text });
      } catch {
        // user cancelled — no action needed
      }
    } else {
      navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    }
  }

  function handleExportText() {
    const text = noteAsPlainText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "note").replace(/[^a-z0-9-_]+/gi, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMoreMenuOpen(false);
  }

  async function handleDuplicateNote() {
    setMoreMenuOpen(false);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${title || "Untitled"} (copy)`,
        content: blocks,
        subject,
        tags,
        coverImageDataUrl,
      }),
    });
    const data = await res.json();
    if (res.ok && data.note?.id) {
      router.push(`/notes/${data.note.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (loadError || !note) {
    return (
      <div className="p-4 text-center" style={{ color: "var(--danger, #e55)" }}>
        {loadError || "Note not found."}
      </div>
    );
  }

  let numberedCounter = 0;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-24">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: "none" }} />
      <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverFileChange} style={{ display: "none" }} />

      <div className="w-full max-w-[600px] mt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4" style={{ position: "relative" }}>
          <button
            onClick={() => router.push("/notes")}
            className="btn-text inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Notes
          </button>
          <div className="flex items-center gap-1">
            {saving && <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)", marginRight: 4 }} />}
            <button
              onClick={handleTogglePinned}
              aria-label={pinned ? "Unpin note" : "Pin note"}
              style={{ background: "none", border: "none", color: pinned ? "var(--accent)" : "var(--text-muted)", padding: 6 }}
            >
              <Star size={18} fill={pinned ? "var(--accent)" : "none"} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share note"
              style={{ background: "none", border: "none", color: "var(--text-muted)", padding: 6 }}
            >
              <Share2 size={17} />
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMoreMenuOpen((v) => !v)}
                aria-label="More options"
                style={{ background: "none", border: "none", color: "var(--text-muted)", padding: 6 }}
              >
                <MoreVertical size={18} />
              </button>
              {moreMenuOpen && (
                <>
                  <div
                    onClick={() => setMoreMenuOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 29 }}
                  />
                  <div
                    className="card"
                    style={{ position: "absolute", top: "100%", right: 0, zIndex: 30, width: 190, padding: 6 }}
                  >
                    <button
                      onClick={handleDuplicateNote}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                      style={{ textAlign: "left", background: "none", border: "none", color: "var(--text)" }}
                    >
                      <Copy size={15} /> Duplicate
                    </button>
                    <button
                      onClick={handleExportText}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                      style={{ textAlign: "left", background: "none", border: "none", color: "var(--text)" }}
                    >
                      <FileDown size={15} /> Export as text
                    </button>
                    <button
                      onClick={() => { setMoreMenuOpen(false); handleDeleteNote(); }}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                      style={{ textAlign: "left", background: "none", border: "none", color: "var(--danger, #e55)" }}
                    >
                      <Trash2 size={15} /> Delete note
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {shareCopied && (
          <div className="text-xs mb-2 text-center" style={{ color: "var(--accent)" }}>
            Copied note to clipboard
          </div>
        )}

        {/* Note header */}
        <div className="mb-4">
          {coverImageDataUrl ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <img
                src={coverImageDataUrl}
                alt=""
                style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, display: "block" }}
              />
              <button
                onClick={handleRemoveCover}
                aria-label="Remove cover image"
                style={{
                  position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)",
                  border: "none", borderRadius: 8, padding: 6, color: "white",
                }}
              >
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePickCover}
              className="flex items-center justify-center gap-2 text-xs w-full mb-3"
              style={{
                background: "var(--surface-2)", border: "1px dashed var(--border)",
                borderRadius: 12, padding: "12px", color: "var(--text-muted)",
              }}
            >
              <ImageIcon size={15} /> Add cover image
            </button>
          )}

          <input
            className="w-full text-2xl font-semibold mb-2"
            style={{
              background: "none", border: "none", outline: "none",
              fontFamily: "var(--font-display)", color: "var(--text)",
            }}
            placeholder="Untitled"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />

          <input
            className="w-full text-sm mb-2"
            style={{
              background: "none", border: "none", outline: "none", color: "var(--text-muted)",
            }}
            placeholder="Subject / category (optional)"
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <TagIcon size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              className="w-full text-xs"
              style={{ background: "none", border: "none", outline: "none", color: "var(--text-muted)" }}
              placeholder="Tags, comma separated"
              value={tagsInput}
              onChange={(e) => handleTagsInputChange(e.target.value)}
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main editor */}
        <div className="space-y-1">
          {blocks.map((block) => {
            if (block.type === BLOCK_TYPES.NUMBERED) numberedCounter += 1;
            else if (block.type !== BLOCK_TYPES.NUMBERED) {
              // reset numbering only when a non-numbered, non-blank-continuation block breaks the run
            }
            return (
              <div key={block.id} className="flex items-start gap-1.5">
                {block.type === BLOCK_TYPES.DIVIDER ? (
                  <div style={{ flex: 1, borderTop: "1px solid var(--border)", margin: "12px 0" }} />
                ) : block.type === BLOCK_TYPES.IMAGE ? (
                  <div style={{ flex: 1 }}>
                    {block.dataUrl ? (
                      <img
                        src={block.dataUrl}
                        alt={block.name || ""}
                        style={{ maxWidth: "100%", borderRadius: 8, display: "block" }}
                      />
                    ) : (
                      <button
                        onClick={() => handlePickImage(block.id)}
                        className="card p-4 w-full text-sm flex items-center justify-center gap-2"
                        style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}
                      >
                        <ImageIcon size={16} /> Add an image
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {block.type === BLOCK_TYPES.CHECKLIST && (
                      <input
                        type="checkbox"
                        checked={!!block.checked}
                        onChange={() => handleToggleCheck(block.id)}
                        style={{ marginTop: 10 }}
                      />
                    )}
                    {block.type === BLOCK_TYPES.BULLET && (
                      <span style={{ marginTop: 9, color: "var(--text-muted)" }}>•</span>
                    )}
                    {block.type === BLOCK_TYPES.NUMBERED && (
                      <span style={{ marginTop: 9, color: "var(--text-muted)", fontSize: 13, minWidth: 16 }}>
                        {numberedCounter}.
                      </span>
                    )}
                    <textarea
                      rows={1}
                      value={block.text}
                      onChange={(e) => { handleBlockTextChange(block.id, e.target.value); autoGrow(e.target); }}
                      onFocus={(e) => autoGrow(e.target)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && block.type !== BLOCK_TYPES.PARAGRAPH) {
                          e.preventDefault();
                          handleAddBlock(block.id, block.type);
                        } else if (e.key === "Backspace" && block.text === "" && blocks.length > 1) {
                          e.preventDefault();
                          handleDeleteBlock(block.id);
                        }
                      }}
                      placeholder={block.type === BLOCK_TYPES.HEADING1 ? "Heading 1" : block.type === BLOCK_TYPES.HEADING2 ? "Heading 2" : "Type something…"}
                      style={{
                        flex: 1, background: "none", border: "none", outline: "none", resize: "none",
                        overflow: "hidden", color: "var(--text)", lineHeight: 1.5,
                        fontFamily: block.type === BLOCK_TYPES.HEADING1 || block.type === BLOCK_TYPES.HEADING2 ? "var(--font-display)" : "inherit",
                        fontSize: block.type === BLOCK_TYPES.HEADING1 ? 22 : block.type === BLOCK_TYPES.HEADING2 ? 18 : 15,
                        fontWeight: block.type === BLOCK_TYPES.HEADING1 || block.type === BLOCK_TYPES.HEADING2 ? 700 : 400,
                        textDecoration: block.type === BLOCK_TYPES.CHECKLIST && block.checked ? "line-through" : "none",
                        opacity: block.type === BLOCK_TYPES.CHECKLIST && block.checked ? 0.5 : 1,
                      }}
                    />
                  </>
                )}

                <div className="flex items-center gap-1" style={{ flexShrink: 0, position: "relative" }}>
                  <button
                    onClick={() => setMenuForBlockId(menuForBlockId === block.id ? null : block.id)}
                    aria-label="Block type"
                    style={{ background: "var(--surface-2)", border: "none", color: "var(--text-muted)", borderRadius: 6, padding: 5 }}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    aria-label="Delete block"
                    style={{ background: "var(--surface-2)", border: "none", color: "var(--text-muted)", borderRadius: 6, padding: 5 }}
                  >
                    <XIcon size={13} />
                  </button>

                  {menuForBlockId === block.id && (
                    <>
                      <div
                        onClick={() => setMenuForBlockId(null)}
                        style={{ position: "fixed", inset: 0, zIndex: 19 }}
                      />
                      <div
                        className="card"
                        style={{ position: "absolute", top: "100%", right: 0, zIndex: 20, width: 180, padding: 6 }}
                      >
                        {BLOCK_MENU.map((item) => (
                          <button
                            key={item.type}
                            onClick={() => handleChangeBlockType(block.id, item.type)}
                            className="flex items-center gap-2 w-full text-left text-xs py-1.5 px-2 rounded"
                            style={{ background: "none", border: "none", color: "var(--text)" }}
                          >
                            <item.icon size={13} /> {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => handleAddBlock(blocks[blocks.length - 1]?.id, BLOCK_TYPES.PARAGRAPH)}
          className="flex items-center gap-1.5 text-xs mt-3"
          style={{ background: "none", border: "none", color: "var(--text-muted)" }}
        >
          <Plus size={13} /> Add block
        </button>
      </div>
    </div>
  );
}
