"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, MoreVertical, Plus, Type, Image as ImageIcon,
  Paperclip, CheckSquare, Trash2, GripHorizontal, X,
} from "lucide-react";
import { BLOCK_TYPES, TEXT_BLOCK_TYPES, createBlock, emptyDoc } from "@/lib/blocks";

const MAX_FILE_BYTES = 4_000_000;
const SAVE_DEBOUNCE_MS = 900;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NoteEditor({ noteId }) {
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(emptyDoc());
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [menuOpenAt, setMenuOpenAt] = useState(null); // index of insert-menu target, or null
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const blockRefs = useRef({});
  const saveTimer = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingBlockIdRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();
      if (res.ok) {
        setNote(data.note);
        setTitle(data.note.title || "");
        setBlocks(
          Array.isArray(data.note.content) && data.note.content.length > 0
            ? data.note.content
            : emptyDoc()
        );
      }
      setLoading(false);
    })();
  }, [noteId]);

  const scheduleSave = useCallback((patch) => {
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, SAVE_DEBOUNCE_MS);
  }, [noteId]);

  function handleTitleChange(e) {
    const value = e.target.value;
    setTitle(value);
    scheduleSave({ title: value });
  }

  function updateBlocks(next) {
    setBlocks(next);
    scheduleSave({ content: next });
  }

  function updateBlock(index, patch) {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
    updateBlocks(next);
  }

  function insertBlockAfter(index, type) {
    const newBlock = createBlock(type);
    const next = [...blocks];
    next.splice(index + 1, 0, newBlock);
    updateBlocks(next);
    pendingBlockIdRef.current = newBlock.id;
    setMenuOpenAt(null);
  }

  function deleteBlock(index) {
    if (blocks.length === 1) {
      updateBlocks(emptyDoc());
      return;
    }
    const next = blocks.filter((_, i) => i !== index);
    updateBlocks(next);
    const prevBlock = blocks[index - 1];
    if (prevBlock) pendingBlockIdRef.current = prevBlock.id;
  }

  useEffect(() => {
    const id = pendingBlockIdRef.current;
    if (id && blockRefs.current[id]) {
      const el = blockRefs.current[id];
      el.focus();
      const len = el.value?.length ?? 0;
      el.setSelectionRange?.(len, len);
    }
    pendingBlockIdRef.current = null;
  }, [blocks]);

  function handleKeyDown(e, index) {
    const block = blocks[index];
    if (!TEXT_BLOCK_TYPES.includes(block.type)) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const followType =
        block.type === BLOCK_TYPES.BULLET ||
        block.type === BLOCK_TYPES.NUMBERED ||
        block.type === BLOCK_TYPES.CHECKLIST
          ? block.type
          : BLOCK_TYPES.PARAGRAPH;
      insertBlockAfter(index, followType);
      return;
    }

    if (e.key === "Backspace" && block.text === "" && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(index);
    }
  }

  async function handleImagePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert("That image is too large — please choose one under 4MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const index = menuOpenAt ?? blocks.length - 1;
    const newBlock = createBlock(BLOCK_TYPES.IMAGE, { dataUrl, name: file.name });
    const next = [...blocks];
    next.splice(index + 1, 0, newBlock);
    updateBlocks(next);
    setMenuOpenAt(null);
  }

  async function handleFilePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert("That file is too large — please choose one under 4MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const index = menuOpenAt ?? blocks.length - 1;
    const newBlock = createBlock(BLOCK_TYPES.FILE, { dataUrl, name: file.name });
    const next = [...blocks];
    next.splice(index + 1, 0, newBlock);
    updateBlocks(next);
    setMenuOpenAt(null);
  }

  function toggleFavorite() {
    const next = !note.pinned;
    setNote((n) => ({ ...n, pinned: next }));
    scheduleSave({ pinned: next });
  }

  async function handleDeleteNote() {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push("/notes");
  }

  if (loading || !note) {
    return <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-32">
      <div className="w-full max-w-[560px] mt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push("/notes")} className="btn-text inline-flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
            </span>
            <button onClick={toggleFavorite} aria-label="Favorite" style={{ background: "none", border: "none", color: note.pinned ? "var(--accent)" : "var(--text-muted)" }}>
              <Star size={18} fill={note.pinned ? "var(--accent)" : "none"} />
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setMoreMenuOpen((v) => !v)} aria-label="More" style={{ background: "none", border: "none", color: "var(--text-muted)" }}>
                <MoreVertical size={18} />
              </button>
              {moreMenuOpen && (
                <div className="card" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 160, padding: 6, zIndex: 20 }}>
                  <button onClick={handleDeleteNote} className="flex items-center gap-2 w-full p-2 rounded-lg text-sm" style={{ textAlign: "left", color: "var(--danger, #e55)" }}>
                    <Trash2 size={14} /> Delete note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <input
          className="text-2xl font-semibold w-full mb-1"
          style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-display)" }}
          placeholder="Untitled"
          value={title}
          onChange={handleTitleChange}
        />
        {note.subject && (
          <div className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{note.subject}</div>
        )}

        {/* Blocks */}
        <div className="space-y-1">
          {blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              index={index}
              registerRef={(el) => { if (el) blockRefs.current[block.id] = el; }}
              onChange={(patch) => updateBlock(index, patch)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onOpenMenu={() => setMenuOpenAt(index)}
              onDelete={() => deleteBlock(index)}
            />
          ))}
        </div>

        {menuOpenAt !== null && (
          <InsertMenu
            onSelect={(type) => {
              if (type === BLOCK_TYPES.IMAGE) { imageInputRef.current?.click(); return; }
              if (type === BLOCK_TYPES.FILE) { fileInputRef.current?.click(); return; }
              insertBlockAfter(menuOpenAt, type);
            }}
            onClose={() => setMenuOpenAt(null)}
          />
        )}

        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImagePicked} style={{ display: "none" }} />
        <input ref={fileInputRef} type="file" onChange={handleFilePicked} style={{ display: "none" }} />
      </div>

      {/* Bottom toolbar */}
      <div
        className="flex items-center justify-center gap-1"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 16px",
          background: "var(--surface)", borderTop: "1px solid var(--border)", zIndex: 30,
        }}
      >
        <ToolbarButton icon={<Plus size={18} />} label="Insert" onClick={() => setMenuOpenAt(blocks.length - 1)} />
        <ToolbarButton icon={<Type size={18} />} label="Text" onClick={() => insertBlockAfter(blocks.length - 1, BLOCK_TYPES.PARAGRAPH)} />
        <ToolbarButton icon={<ImageIcon size={18} />} label="Image" onClick={() => { setMenuOpenAt(blocks.length - 1); imageInputRef.current?.click(); }} />
        <ToolbarButton icon={<Paperclip size={18} />} label="File" onClick={() => { setMenuOpenAt(blocks.length - 1); fileInputRef.current?.click(); }} />
        <ToolbarButton icon={<CheckSquare size={18} />} label="Checklist" onClick={() => insertBlockAfter(blocks.length - 1, BLOCK_TYPES.CHECKLIST)} />
      </div>
    </div>
  );
}

function ToolbarButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-11 h-11 rounded-full flex items-center justify-center"
      style={{ background: "var(--surface-2)", color: "var(--text)" }}
    >
      {icon}
    </button>
  );
}

function InsertMenu({ onSelect, onClose }) {
  const options = [
    { type: BLOCK_TYPES.PARAGRAPH, label: "Text" },
    { type: BLOCK_TYPES.HEADING1, label: "Heading 1" },
    { type: BLOCK_TYPES.HEADING2, label: "Heading 2" },
    { type: BLOCK_TYPES.BULLET, label: "Bullet list" },
    { type: BLOCK_TYPES.NUMBERED, label: "Numbered list" },
    { type: BLOCK_TYPES.CHECKLIST, label: "Checklist" },
    { type: BLOCK_TYPES.IMAGE, label: "Image" },
    { type: BLOCK_TYPES.FILE, label: "File attachment" },
    { type: BLOCK_TYPES.DIVIDER, label: "Divider" },
  ];
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={onClose} />
      <div className="card" style={{ position: "sticky", bottom: 70, padding: 6, zIndex: 41, marginTop: 8 }}>
        {options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onSelect(opt.type)}
            className="flex items-center w-full p-2.5 rounded-lg text-sm"
            style={{ textAlign: "left" }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}

function BlockRow({ block, index, registerRef, onChange, onKeyDown, onOpenMenu, onDelete }) {
  const commonTextProps = {
    ref: registerRef,
    value: block.text ?? "",
    onChange: (e) => onChange({ text: e.target.value }),
    onKeyDown,
    rows: 1,
    className: "w-full",
    style: {
      background: "none", border: "none", outline: "none", resize: "none",
      overflow: "hidden", lineHeight: 1.5, padding: "4px 0",
    },
    onInput: (e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; },
  };

  let content;
  switch (block.type) {
    case BLOCK_TYPES.HEADING1:
      content = <textarea {...commonTextProps} placeholder="Heading" style={{ ...commonTextProps.style, fontSize: 22, fontWeight: 700 }} />;
      break;
    case BLOCK_TYPES.HEADING2:
      content = <textarea {...commonTextProps} placeholder="Heading" style={{ ...commonTextProps.style, fontSize: 18, fontWeight: 600 }} />;
      break;
    case BLOCK_TYPES.BULLET:
      content = (
        <div className="flex items-start gap-2">
          <span style={{ marginTop: 8 }}>•</span>
          <textarea {...commonTextProps} placeholder="List item" />
        </div>
      );
      break;
    case BLOCK_TYPES.NUMBERED:
      content = (
        <div className="flex items-start gap-2">
          <span style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)", minWidth: 16 }}>{index + 1}.</span>
          <textarea {...commonTextProps} placeholder="List item" />
        </div>
      );
      break;
    case BLOCK_TYPES.CHECKLIST:
      content = (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={!!block.checked}
            onChange={(e) => onChange({ checked: e.target.checked })}
            style={{ marginTop: 8 }}
          />
          <textarea
            {...commonTextProps}
            placeholder="To-do"
            style={{
              ...commonTextProps.style,
              textDecoration: block.checked ? "line-through" : "none",
              color: block.checked ? "var(--text-muted)" : "var(--text)",
            }}
          />
        </div>
      );
      break;
    case BLOCK_TYPES.IMAGE:
      content = (
        <img src={block.dataUrl} alt={block.name || ""} style={{ maxWidth: "100%", borderRadius: 10 }} />
      );
      break;
    case BLOCK_TYPES.FILE:
      content = (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
          <Paperclip size={14} style={{ color: "var(--text-muted)" }} />
          <a href={block.dataUrl} download={block.name} className="text-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {block.name}
          </a>
        </div>
      );
      break;
    case BLOCK_TYPES.DIVIDER:
      content = <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />;
      break;
    default:
      content = <textarea {...commonTextProps} placeholder="Write something…" />;
  }

  return (
    <div className="flex items-start gap-1" style={{ position: "relative" }}>
      <div style={{ flex: 1, minWidth: 0 }}>{content}</div>
      <button
        onClick={onOpenMenu}
        aria-label="Insert below"
        style={{ background: "none", border: "none", color: "var(--text-muted)", opacity: 0.5, marginTop: 4 }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}