"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, MoreVertical, Plus, Type, Image as ImageIcon,
  Paperclip, CheckSquare, Trash2, X, Folder as FolderIcon,
  ClipboardCheck, Send, GripVertical, Sparkles, Loader2, AlertCircle, RefreshCw,
  ChevronRight, ChevronDown,
} from "lucide-react";
import {
  BLOCK_TYPES, TEXT_BLOCK_TYPES, NON_TEXT_TYPES, createBlock, emptyDoc, extractNoteContent,
} from "@/lib/blocks";

const MAX_FILE_BYTES = 4_000_000;
const SAVE_DEBOUNCE_MS = 900;

const AI_ACTIONS = [
  { key: "flashcards", label: "Generate Flashcards", emoji: "🎴" },
  { key: "quiz", label: "Generate Quiz", emoji: "🧠" },
  { key: "summary", label: "Summarize", emoji: "📝" },
  { key: "explain", label: "Explain this", emoji: "💡" },
  { key: "keypoints", label: "Find Key Points", emoji: "🔑" },
];

// A block is hidden if it falls after a collapsed Heading 1/2, up until
// the next heading of the same or higher level (H1 collapses hide any
// nested H2s too; H2 only hides until the next H1 or H2).
function getVisibleFlags(blocks) {
  const flags = [];
  let hideLevel = null;
  for (const block of blocks) {
    const level = block.type === BLOCK_TYPES.HEADING1 ? 1 : block.type === BLOCK_TYPES.HEADING2 ? 2 : null;
    if (level !== null && hideLevel !== null && level <= hideLevel) {
      hideLevel = null;
    }
    const hidden = hideLevel !== null;
    flags.push(hidden);
    if (level !== null && !hidden && block.collapsed) {
      hideLevel = level;
    }
  }
  return flags;
}

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
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [menuOpenAt, setMenuOpenAt] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [folders, setFolders] = useState([]);

  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiRunning, setAiRunning] = useState(null);
  const [aiError, setAiError] = useState("");

  const blockRefs = useRef({});
  const saveTimer = useRef(null);
  const pendingPatchRef = useRef({});
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingBlockIdRef = useRef(null);
  const dragIndexRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [noteRes, foldersRes] = await Promise.all([
        fetch(`/api/notes/${noteId}`),
        fetch("/api/folders"),
      ]);
      const noteData = await noteRes.json();
      if (noteRes.ok) {
        setNote(noteData.note);
        setTitle(noteData.note.title || "");
        setBlocks(
          Array.isArray(noteData.note.content) && noteData.note.content.length > 0
            ? noteData.note.content
            : emptyDoc()
        );
      }
      const foldersData = await foldersRes.json();
      if (foldersRes.ok) setFolders(foldersData.folders || []);
      setLoading(false);
    })();
  }, [noteId]);

  // Sends whatever's queued in pendingPatchRef right now, bypassing the
  // debounce. Used on visibility change, page unload, and unmount so a
  // save never silently gets dropped by navigating away too quickly.
  const flushSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const patch = pendingPatchRef.current;
    if (Object.keys(patch).length === 0) return;
    pendingPatchRef.current = {};
    setSaveState("saving");
    fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      keepalive: true,
    })
      .then((res) => {
        setSaveState(res.ok ? "saved" : "error");
      })
      .catch(() => setSaveState("error"));
  }, [noteId]);

  const scheduleSave = useCallback((patch) => {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  // Flush immediately whenever the tab is hidden/backgrounded, the page
  // is about to unload, or this editor unmounts (e.g. tapping Back) —
  // instead of waiting out the debounce and risking the save never firing.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") flushSave();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flushSave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flushSave);
      flushSave();
    };
  }, [flushSave]);

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

  function toggleAssignment() {
    const next = !note.isAssignment;
    setNote((n) => ({ ...n, isAssignment: next }));
    scheduleSave({ isAssignment: next });
    setMoreMenuOpen(false);
  }

  function updateDueDate(value) {
    setNote((n) => ({ ...n, dueDate: value || null }));
    scheduleSave({ dueDate: value || null });
  }

  function toggleSubmit() {
    const next = !note.submitted;
    setNote((n) => ({ ...n, submitted: next }));
    scheduleSave({ submitted: next });
  }

  function moveToFolder(folderId) {
    setNote((n) => ({ ...n, folderId }));
    scheduleSave({ folderId });
    setFolderPickerOpen(false);
    setMoreMenuOpen(false);
  }

  async function handleDeleteNote() {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push("/notes");
  }

  function handleDragStart(index) {
    dragIndexRef.current = index;
  }

  function handleDrop(targetIndex) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    updateBlocks(next);
  }

  async function runAiAction(actionKey) {
    setAiError("");
    const { text, images } = extractNoteContent(blocks);

    if (!text.trim() && images.length === 0) {
      setAiError("Add some text or an image to this note first.");
      return;
    }

    setAiRunning(actionKey);
    setAiMenuOpen(false);

    try {
      if (actionKey === "flashcards") {
        const res = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: text, subject: note.subject || "",
            title: title || "Untitled", images,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setAiError(data.error || "Could not generate flashcards."); setAiRunning(null); return; }
        router.push(`/tools/school/flashcards/${data.deck.id}`);
        return;
      }

      const res = await fetch("/api/study-tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: actionKey, notes: text, subject: note.subject || "",
          title: title || "Untitled", images,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "Could not generate that."); setAiRunning(null); return; }
      router.push(`/tools/school/smart-tools/${data.run.id}`);
    } catch {
      setAiError("Network error. Please try again.");
      setAiRunning(null);
    }
  }

  if (loading || !note) {
    return <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}>Loading…</div>;
  }

  const currentFolder = folders.find((f) => f.id === note.folderId);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-32">
      <div className="w-full max-w-[560px] mt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push("/notes")} className="btn-text inline-flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: saveState === "error" ? "var(--danger, #e55)" : "var(--text-muted)" }}
            >
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && (
                <>
                  Save failed
                  <button onClick={flushSave} aria-label="Retry save" style={{ background: "none", border: "none", color: "var(--danger, #e55)", display: "flex" }}>
                    <RefreshCw size={11} />
                  </button>
                </>
              )}
            </span>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setAiMenuOpen((v) => !v)}
                aria-label="Vreedits AI"
                disabled={aiRunning !== null}
                style={{ background: "none", border: "none", color: "var(--accent)" }}
              >
                {aiRunning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </button>
              {aiMenuOpen && (
                <div className="card" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 210, padding: 6, zIndex: 21 }}>
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.key}
                      onClick={() => runAiAction(action.key)}
                      className="flex items-center gap-2 w-full p-2 rounded-lg text-sm"
                      style={{ textAlign: "left" }}
                    >
                      <span>{action.emoji}</span> {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggleFavorite} aria-label="Favorite" style={{ background: "none", border: "none", color: note.pinned ? "var(--accent)" : "var(--text-muted)" }}>
              <Star size={18} fill={note.pinned ? "var(--accent)" : "none"} />
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setMoreMenuOpen((v) => !v)} aria-label="More" style={{ background: "none", border: "none", color: "var(--text-muted)" }}>
                <MoreVertical size={18} />
              </button>
              {moreMenuOpen && (
                <div className="card" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 200, padding: 6, zIndex: 20 }}>
                  <button
                    onClick={() => { setFolderPickerOpen(true); setMoreMenuOpen(false); }}
                    className="flex items-center gap-2 w-full p-2 rounded-lg text-sm"
                    style={{ textAlign: "left" }}
                  >
                    <FolderIcon size={14} /> Move to folder
                  </button>
                  <button
                    onClick={toggleAssignment}
                    className="flex items-center gap-2 w-full p-2 rounded-lg text-sm"
                    style={{ textAlign: "left" }}
                  >
                    <ClipboardCheck size={14} /> {note.isAssignment ? "Remove assignment" : "Turn into assignment"}
                  </button>
                  <button onClick={handleDeleteNote} className="flex items-center gap-2 w-full p-2 rounded-lg text-sm" style={{ textAlign: "left", color: "var(--danger, #e55)" }}>
                    <Trash2 size={14} /> Delete note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {saveState === "error" && (
          <div className="alert alert-error mb-3">
            <AlertCircle size={14} />
            Your last change didn't save. Tap the retry icon above before leaving this note.
          </div>
        )}

        {aiError && (
          <div className="alert alert-error mb-3">{aiError}</div>
        )}

        {folderPickerOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setFolderPickerOpen(false)} />
            <div className="card" style={{ position: "relative", padding: 6, zIndex: 41, marginBottom: 12 }}>
              <button
                onClick={() => moveToFolder(null)}
                className="flex items-center w-full p-2.5 rounded-lg text-sm"
                style={{ textAlign: "left", fontWeight: !note.folderId ? 600 : 400 }}
              >
                No folder
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => moveToFolder(f.id)}
                  className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm"
                  style={{ textAlign: "left", fontWeight: note.folderId === f.id ? 600 : 400 }}
                >
                  <FolderIcon size={13} /> {f.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Header */}
        <input
          className="text-2xl font-semibold w-full mb-1"
          style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-display)" }}
          placeholder="Untitled"
          value={title}
          onChange={handleTitleChange}
        />
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {note.subject && (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{note.subject}</span>
          )}
          {currentFolder && (
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              <FolderIcon size={10} /> {currentFolder.name}
            </span>
          )}
        </div>

        {note.isAssignment && (
          <div className="card p-3 mb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-semibold">Assignment</span>
              </div>
              <input
                type="date"
                value={note.dueDate ? note.dueDate.slice(0, 10) : ""}
                onChange={(e) => updateDueDate(e.target.value)}
                className="input pl-3"
                style={{ maxWidth: 160, height: 32, fontSize: 12 }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <button
                onClick={toggleSubmit}
                className="btn-primary"
                style={note.submitted ? { background: "var(--surface-2)", color: "var(--text)" } : {}}
              >
                <Send size={13} /> {note.submitted ? "Submitted — undo" : "Submit"}
              </button>
              {note.submitted && (
                <Link
                  href={`/tools/school/flashcards?noteId=${noteId}`}
                  className="btn-text inline-flex items-center gap-1.5 text-xs"
                >
                  <Sparkles size={12} /> Generate study materials
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-1">
          {(() => {
            const hiddenFlags = getVisibleFlags(blocks);
            return blocks.map((block, index) => {
              if (hiddenFlags[index]) return null;
              return (
                <BlockRow
                  key={block.id}
                  block={block}
                  index={index}
                  registerRef={(el) => {
                    if (el) {
                      blockRefs.current[block.id] = el;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                  onChange={(patch) => updateBlock(index, patch)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onOpenMenu={() => setMenuOpenAt(index)}
                  onDelete={() => deleteBlock(index)}
                  onDragStart={() => handleDragStart(index)}
                  onDrop={() => handleDrop(index)}
                />
              );
            });
          })()}
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
    { type: BLOCK_TYPES.TABLE, label: "Table" },
    { type: BLOCK_TYPES.CODE, label: "Code block" },
    { type: BLOCK_TYPES.DATE, label: "Date" },
    { type: BLOCK_TYPES.IMAGE, label: "Image" },
    { type: BLOCK_TYPES.FILE, label: "File attachment" },
    { type: BLOCK_TYPES.DIVIDER, label: "Divider" },
  ];
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={onClose} />
      <div className="card" style={{ position: "sticky", bottom: 70, padding: 6, zIndex: 41, marginTop: 8, maxHeight: 320, overflowY: "auto" }}>
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

function BlockRow({ block, index, registerRef, onChange, onKeyDown, onOpenMenu, onDelete, onDragStart, onDrop }) {
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
      content = <img src={block.dataUrl} alt={block.name || ""} style={{ maxWidth: "100%", borderRadius: 10 }} />;
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
    case BLOCK_TYPES.TABLE: {
      const rows = block.rows || [["", ""], ["", ""]];
      const updateCell = (r, c, value) => {
        const next = rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row));
        onChange({ rows: next });
      };
      const addRow = () => {
        const cols = rows[0]?.length || 2;
        onChange({ rows: [...rows, Array(cols).fill("")] });
      };
      const addCol = () => onChange({ rows: rows.map((row) => [...row, ""]) });
      content = (
        <div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} style={{ border: "1px solid var(--border)", padding: 0 }}>
                      <input
                        value={cell}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                        style={{ width: "100%", background: "none", border: "none", outline: "none", padding: "6px 8px", fontSize: 13 }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={addRow} className="text-xs" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>+ Row</button>
            <button type="button" onClick={addCol} className="text-xs" style={{ color: "var(--text-muted)", background: "none", border: "none" }}>+ Column</button>
          </div>
        </div>
      );
      break;
    }
    case BLOCK_TYPES.CODE:
      content = (
        <textarea
          ref={registerRef}
          value={block.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Code"
          rows={1}
          style={{
            width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8,
            outline: "none", resize: "none", overflow: "hidden", fontFamily: "monospace", fontSize: 13,
            padding: "8px 10px", lineHeight: 1.5,
          }}
          onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
        />
      );
      break;
    case BLOCK_TYPES.DATE:
      content = (
        <input
          type="date"
          value={block.date || ""}
          onChange={(e) => onChange({ date: e.target.value })}
          className="input pl-3"
          style={{ maxWidth: 200 }}
        />
      );
      break;
    default:
      content = <textarea {...commonTextProps} placeholder="Write something…" />;
  }

  return (
    <div
      className="flex items-start gap-1"
      style={{ position: "relative" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div
        draggable
        onDragStart={onDragStart}
        style={{ cursor: "grab", color: "var(--text-muted)", opacity: 0.35, marginTop: 6, flexShrink: 0 }}
      >
        <GripVertical size={14} />
      </div>
      {(block.type === BLOCK_TYPES.HEADING1 || block.type === BLOCK_TYPES.HEADING2) && (
        <button
          onClick={() => onChange({ collapsed: !block.collapsed })}
          aria-label={block.collapsed ? "Expand section" : "Collapse section"}
          style={{ background: "none", border: "none", color: "var(--text-muted)", marginTop: 4, flexShrink: 0 }}
        >
          {block.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>{content}</div>
      <button onClick={onDelete} aria-label="Delete block" style={{ background: "none", border: "none", color: "var(--text-muted)", opacity: 0.5, marginTop: 4 }}>
        <Trash2 size={13} />
      </button>
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
