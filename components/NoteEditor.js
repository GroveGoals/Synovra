"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Star, Trash2, Plus, Image as ImageIcon,
  Type, Heading1, Heading2, List, ListOrdered, CheckSquare, Minus, X as XIcon,
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
  const pendingImageBlockId = useRef(null);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuForBlockId, setMenuForBlockId] = useState(null);

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
    } catch (err) {
      setLoadError("Network error loading note.");
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => { load(); }, [load]);

  const scheduleSave = useCallback((nextTitle, nextBlocks, nextPinned) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, content: nextBlocks, pinned: nextPinned }),
      });
      setSaving(false);
    }, 700);
  }, [noteId]);

  function handleTitleChange(value) {
    setTitle(value);
    scheduleSave(value, blocks, pinned);
  }

  function updateBlocks(next) {
    setBlocks(next);
    scheduleSave(title, next, pinned);
  }

  function handleTogglePinned() {
    const next = !pinned;
    setPinned(next);
    scheduleSave(title, blocks, next);
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

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-24">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        style={{ display: "none" }}
      />
      <div className="w-full max-w-[600px] mt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/notes")}
            className="btn-text inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Notes
          </button>
          <div className="flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
            <button
              onClick={handleTogglePinned}
              aria-label={pinned ? "Unpin note" : "Pin note"}
              style={{ background: "none", border: "none", color: pinned ? "var(--accent)" : "var(--text-muted)" }}
            >
              <Star size={18} fill={pinned ? "var(--accent)" : "none"} />
            </button>
            <button
              onClick={handleDeleteNote}
              aria-label="Delete note"
              style={{ background: "none", border: "none", color: "var(--text-muted)" }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <input
          className="w-full text-2xl font-semibold mb-4"
          style={{
            background: "none", border: "none", outline: "none",
            fontFamily: "var(--font-display)", color: "var(--text)",
          }}
          placeholder="Untitled"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <div className="space-y-1">
          {blocks.map((block) => (
            <div key={block.id} className="group flex items-start gap-1.5">
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
                    <span style={{ marginTop: 9, color: "var(--text-muted)", fontSize: 13 }}>
                      {blocks.filter((b, i) => b.type === BLOCK_TYPES.NUMBERED && blocks.indexOf(b) <= blocks.indexOf(block)).length}.
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

              <div
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1"
                style={{ flexShrink: 0, position: "relative" }}
              >
                <button
                  onClick={() => setMenuForBlockId(menuForBlockId === block.id ? null : block.id)}
                  aria-label="Block type"
                  style={{ background: "none", border: "none", color: "var(--text-muted)" }}
                >
                  <Plus size={15} />
                </button>
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  aria-label="Delete block"
                  style={{ background: "none", border: "none", color: "var(--text-muted)" }}
                >
                  <XIcon size={14} />
                </button>

                {menuForBlockId === block.id && (
                  <div
                    className="card"
                    style={{
                      position: "absolute", top: "100%", right: 0, zIndex: 20,
                      width: 180, padding: 6,
                    }}
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
                )}
              </div>
            </div>
          ))}
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