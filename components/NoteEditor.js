"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Star,
  Trash2,
  Plus,
  Image as ImageIcon,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  X as XIcon,
  Share2,
  MoreVertical,
  Copy,
  FileDown,
  Tag as TagIcon,
  Paperclip,
  Link2,
  Table2,
  Code2,
  Calendar,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import {
  createBlock,
  emptyDoc,
  BLOCK_TYPES,
} from "@/lib/blocks";

const BLOCK_MENU = [
  { type: BLOCK_TYPES.PARAGRAPH, label: "Text", icon: Type },
  { type: BLOCK_TYPES.HEADING1, label: "Heading 1", icon: Heading1 },
  { type: BLOCK_TYPES.HEADING2, label: "Heading 2", icon: Heading2 },
  { type: BLOCK_TYPES.BULLET, label: "Bullet list", icon: List },
  { type: BLOCK_TYPES.NUMBERED, label: "Numbered list", icon: ListOrdered },
  { type: BLOCK_TYPES.CHECKLIST, label: "Checklist", icon: CheckSquare },
  { type: BLOCK_TYPES.IMAGE, label: "Image", icon: ImageIcon },
  { type: BLOCK_TYPES.ATTACHMENT, label: "File attachment", icon: Paperclip },
  { type: BLOCK_TYPES.LINK, label: "Link", icon: Link2 },
  { type: BLOCK_TYPES.TABLE, label: "Table", icon: Table2 },
  { type: BLOCK_TYPES.CODE, label: "Code block", icon: Code2 },
  { type: BLOCK_TYPES.DATE, label: "Date", icon: Calendar },
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
  const attachmentInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const pendingImageBlockId = useRef(null);
  const pendingAttachmentBlockId = useRef(null);

  const saveTimeout = useRef(null);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);

  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [subject, setSubject] = useState("");

  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState([]);

  const [menuForBlockId, setMenuForBlockId] = useState(null);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();

      if (!res.ok) {
        setLoadError(data.error || "Could not load this note.");
        return;
      }

      const loadedBlocks =
        Array.isArray(data.note.content) && data.note.content.length
          ? data.note.content
          : emptyDoc();

      setNote(data.note);
      setTitle(data.note.title || "");
      setBlocks(loadedBlocks);
      setPinned(!!data.note.pinned);

      // Prisma field is coverImageUrl.
      setCoverImageUrl(data.note.coverImageUrl || null);

      setSubject(data.note.subject || "");

      const loadedTags = Array.isArray(data.note.tags)
        ? data.note.tags
        : [];

      setTags(loadedTags);
      setTagsInput(loadedTags.join(", "));

      if (loadedBlocks.length) {
        setActiveBlockId(loadedBlocks[0].id);
      }
    } catch {
      setLoadError("Network error loading note.");
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    load();

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [load]);

  const buildSavePayload = useCallback(
    (overrides = {}) => ({
      title,
      content: blocks,
      pinned,
      coverImageUrl,
      subject,
      tags,
      ...overrides,
    }),
    [
      title,
      blocks,
      pinned,
      coverImageUrl,
      subject,
      tags,
    ]
  );

  const scheduleSave = useCallback(
    (next) => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(async () => {
        setSaving(true);

        try {
          await fetch(`/api/notes/${noteId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(next),
          });
        } catch {
          // Keep editor usable even if the save request fails.
        } finally {
          setSaving(false);
        }
      }, 700);
    },
    [noteId]
  );

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

    const nextTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setTags(nextTags);
    scheduleSave(buildSavePayload({ tags: nextTags }));
  }

  function handlePickCover() {
    coverInputRef.current?.click();
  }

  function handleCoverFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      setCoverImageUrl(result);
      scheduleSave(
        buildSavePayload({
          coverImageUrl: result,
        })
      );
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleRemoveCover() {
    setCoverImageUrl(null);

    scheduleSave(
      buildSavePayload({
        coverImageUrl: null,
      })
    );
  }

  function handleBlockTextChange(blockId, text) {
    const next = blocks.map((block) =>
      block.id === blockId
        ? { ...block, text }
        : block
    );

    updateBlocks(next);
  }

  function handleToggleCheck(blockId) {
    const next = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            checked: !block.checked,
          }
        : block
    );

    updateBlocks(next);
  }

  function insertBlockAfter(blockId, type) {
    const newBlock = createBlock(type);

    const index = blocks.findIndex(
      (block) => block.id === blockId
    );

    const next = [...blocks];

    if (index === -1) {
      next.push(newBlock);
    } else {
      next.splice(index + 1, 0, newBlock);
    }

    updateBlocks(next);

    setActiveBlockId(newBlock.id);
    setMenuForBlockId(null);
    setInsertMenuOpen(false);

    return newBlock.id;
  }

  function addBlockFromToolbar(type) {
    const targetId =
      activeBlockId || blocks[blocks.length - 1]?.id;

    insertBlockAfter(targetId, type);
  }

  function handleAddBlock(afterId, type = BLOCK_TYPES.PARAGRAPH) {
    return insertBlockAfter(afterId, type);
  }

  function handleDeleteBlock(blockId) {
    if (blocks.length <= 1) {
      const next = emptyDoc();

      updateBlocks(next);
      setActiveBlockId(next[0]?.id || null);
      return;
    }

    const index = blocks.findIndex(
      (block) => block.id === blockId
    );

    const next = blocks.filter(
      (block) => block.id !== blockId
    );

    updateBlocks(next);

    const nextActive =
      next[index] ||
      next[index - 1] ||
      next[0];

    setActiveBlockId(nextActive?.id || null);
  }

  function handleChangeBlockType(blockId, newType) {
    const next = blocks.map((block) => {
      if (block.id !== blockId) {
        return block;
      }

      const fresh = createBlock(newType, {
        id: block.id,
      });

      if (
        block.text !== undefined &&
        fresh.text !== undefined
      ) {
        fresh.text = block.text;
      }

      if (block.checked !== undefined) {
        fresh.checked = block.checked;
      }

      return fresh;
    });

    updateBlocks(next);
    setMenuForBlockId(null);
  }

  function handlePickImage(blockId) {
    pendingImageBlockId.current = blockId;
    fileInputRef.current?.click();
  }

  function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    const blockId = pendingImageBlockId.current;

    if (!file || !blockId) return;

    const reader = new FileReader();

    reader.onload = () => {
      const next = blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              dataUrl: reader.result,
              name: file.name,
            }
          : block
      );

      updateBlocks(next);
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function handleAddImageFromToolbar() {
    const blockId = addBlockFromToolbar(
      BLOCK_TYPES.IMAGE
    );

    pendingImageBlockId.current = blockId;

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  }

  function handlePickAttachment(blockId) {
    pendingAttachmentBlockId.current = blockId;
    attachmentInputRef.current?.click();
  }

  function handleAddAttachmentFromToolbar() {
    const blockId = addBlockFromToolbar(
      BLOCK_TYPES.ATTACHMENT
    );

    pendingAttachmentBlockId.current = blockId;

    setTimeout(() => {
      attachmentInputRef.current?.click();
    }, 0);
  }

  function handleAttachmentFileChange(event) {
    const file = event.target.files?.[0];
    const blockId = pendingAttachmentBlockId.current;

    if (!file || !blockId) return;

    const reader = new FileReader();

    reader.onload = () => {
      const next = blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              name: file.name,
              dataUrl: reader.result,
              size: file.size,
              mimeType: file.type,
            }
          : block
      );

      updateBlocks(next);
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function handleAddLink() {
    const url = window.prompt("Enter link URL");

    if (!url) return;

    const blockId = addBlockFromToolbar(
      BLOCK_TYPES.LINK
    );

    const next = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            url,
            text: url,
          }
        : block
    );

    updateBlocks(next);
  }

  function handleAddDate() {
    const date = window.prompt(
      "Enter date",
      new Date().toISOString().slice(0, 10)
    );

    if (!date) return;

    const blockId = addBlockFromToolbar(
      BLOCK_TYPES.DATE
    );

    const next = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            text: date,
            date,
          }
        : block
    );

    updateBlocks(next);
  }

  function handleAddTable() {
    const blockId = addBlockFromToolbar(
      BLOCK_TYPES.TABLE
    );

    const next = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            rows: [
              ["", ""],
              ["", ""],
            ],
          }
        : block
    );

    updateBlocks(next);
  }

  function handleAddCode() {
    addBlockFromToolbar(BLOCK_TYPES.CODE);
  }

  function handleInsertType(type) {
    if (type === BLOCK_TYPES.IMAGE) {
      handleAddImageFromToolbar();
      return;
    }

    if (type === BLOCK_TYPES.ATTACHMENT) {
      handleAddAttachmentFromToolbar();
      return;
    }

    if (type === BLOCK_TYPES.LINK) {
      handleAddLink();
      return;
    }

    if (type === BLOCK_TYPES.TABLE) {
      handleAddTable();
      return;
    }

    if (type === BLOCK_TYPES.CODE) {
      handleAddCode();
      return;
    }

    if (type === BLOCK_TYPES.DATE) {
      handleAddDate();
      return;
    }

    addBlockFromToolbar(type);
  }

  async function handleDeleteNote() {
    if (
      !window.confirm(
        "Delete this note? This can't be undone."
      )
    ) {
      return;
    }

    await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    });

    router.push("/notes");
  }

  function blockToPlainText(block) {
    if (block.type === BLOCK_TYPES.DIVIDER) {
      return "---";
    }

    if (block.type === BLOCK_TYPES.IMAGE) {
      return block.name
        ? `[Image: ${block.name}]`
        : "[Image]";
    }

    if (block.type === BLOCK_TYPES.ATTACHMENT) {
      return block.name
        ? `[Attachment: ${block.name}]`
        : "[Attachment]";
    }

    if (block.type === BLOCK_TYPES.LINK) {
      return block.url || block.text || "";
    }

    if (block.type === BLOCK_TYPES.CHECKLIST) {
      return `${block.checked ? "[x]" : "[ ]"} ${
        block.text || ""
      }`;
    }

    if (block.type === BLOCK_TYPES.BULLET) {
      return `• ${block.text || ""}`;
    }

    if (block.type === BLOCK_TYPES.NUMBERED) {
      return `1. ${block.text || ""}`;
    }

    return block.text || "";
  }

  function noteAsPlainText() {
    const lines = [
      title || "Untitled",
      "",
    ];

    blocks.forEach((block) => {
      lines.push(blockToPlainText(block));
    });

    return lines.join("\n");
  }

  async function handleShare() {
    const text = noteAsPlainText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Untitled note",
          text,
        });
      } catch {
        // User cancelled sharing.
      }
    } else {
      await navigator.clipboard.writeText(text);

      setShareCopied(true);

      setTimeout(() => {
        setShareCopied(false);
      }, 1500);
    }
  }

  function handleExportText() {
    const text = noteAsPlainText();

    const blob = new Blob([text], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${(
      title || "note"
    ).replace(/[^a-z0-9-_]+/gi, "-")}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

    setMoreMenuOpen(false);
  }

  async function handleDuplicateNote() {
    setMoreMenuOpen(false);

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `${title || "Untitled"} (copy)`,
        content: blocks,
        subject,
        tags,
        coverImageUrl,
      }),
    });

    const data = await res.json();

    if (res.ok && data.note?.id) {
      router.push(`/notes/${data.note.id}`);
    }
  }

  if (loading) {
    return (
      <div
        className="flex justify-center py-16"
        style={{
          color: "var(--text-muted)",
        }}
      >
        <Loader2
          size={22}
          className="animate-spin"
        />
      </div>
    );
  }

  if (loadError || !note) {
    return (
      <div
        className="p-4 text-center"
        style={{
          color: "var(--danger, #e55)",
        }}
      >
        {loadError || "Note not found."}
      </div>
    );
  }

  let numberedCounter = 0;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-24">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        style={{ display: "none" }}
      />

      <input
        ref={attachmentInputRef}
        type="file"
        onChange={handleAttachmentFileChange}
        style={{ display: "none" }}
      />

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileChange}
        style={{ display: "none" }}
      />

      <div className="w-full max-w-[700px] mt-6">
        {/* Top bar */}
        <div
          className="flex items-center justify-between mb-4"
          style={{
            position: "relative",
          }}
        >
          <button
            onClick={() => router.push("/notes")}
            className="btn-text inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Notes
          </button>

          <div className="flex items-center gap-1">
            {saving && (
              <div
                className="flex items-center gap-1 mr-2 text-xs"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                <Loader2
                  size={13}
                  className="animate-spin"
                />
                Saving
              </div>
            )}

            {!saving && (
              <span
                className="text-xs mr-2"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Saved
              </span>
            )}

            <button
              onClick={handleTogglePinned}
              aria-label={
                pinned
                  ? "Unpin note"
                  : "Pin note"
              }
              style={{
                background: "none",
                border: "none",
                color: pinned
                  ? "var(--accent)"
                  : "var(--text-muted)",
                padding: 6,
              }}
            >
              <Star
                size={18}
                fill={
                  pinned
                    ? "var(--accent)"
                    : "none"
                }
              />
            </button>

            <button
              onClick={handleShare}
              aria-label="Share note"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                padding: 6,
              }}
            >
              <Share2 size={17} />
            </button>

            <div
              style={{
                position: "relative",
              }}
            >
              <button
                onClick={() =>
                  setMoreMenuOpen(
                    (value) => !value
                  )
                }
                aria-label="More options"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  padding: 6,
                }}
              >
                <MoreVertical size={18} />
              </button>

              {moreMenuOpen && (
                <>
                  <div
                    onClick={() =>
                      setMoreMenuOpen(false)
                    }
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 29,
                    }}
                  />

                  <div
                    className="card"
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      zIndex: 30,
                      width: 190,
                      padding: 6,
                    }}
                  >
                    <button
                      onClick={
                        handleDuplicateNote
                      }
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: "var(--text)",
                      }}
                    >
                      <Copy size={15} />
                      Duplicate
                    </button>

                    <button
                      onClick={handleExportText}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: "var(--text)",
                      }}
                    >
                      <FileDown size={15} />
                      Export as text
                    </button>

                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        handleDeleteNote();
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-sm"
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color:
                          "var(--danger, #e55)",
                      }}
                    >
                      <Trash2 size={15} />
                      Delete note
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {shareCopied && (
          <div
            className="text-xs mb-2 text-center"
            style={{
              color: "var(--accent)",
            }}
          >
            Copied note to clipboard
          </div>
        )}

        {/* Note header */}
        <div className="mb-6">
          {coverImageUrl ? (
            <div
              style={{
                position: "relative",
                marginBottom: 12,
              }}
            >
              <img
                src={coverImageUrl}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                }}
              />

              <button
                onClick={handleRemoveCover}
                aria-label="Remove cover image"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background:
                    "rgba(0,0,0,0.5)",
                  border: "none",
                  borderRadius: 8,
                  padding: 6,
                  color: "white",
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
                background:
                  "var(--surface-2)",
                border:
                  "1px dashed var(--border)",
                borderRadius: 12,
                padding: "12px",
                color: "var(--text-muted)",
              }}
            >
              <ImageIcon size={15} />
              Add cover image
            </button>
          )}

          <input
            className="w-full text-2xl font-semibold mb-2"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              fontFamily:
                "var(--font-display)",
              color: "var(--text)",
            }}
            placeholder="Untitled"
            value={title}
            onChange={(event) =>
              handleTitleChange(
                event.target.value
              )
            }
          />

          <input
            className="w-full text-sm mb-2"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-muted)",
            }}
            placeholder="Subject / category (optional)"
            value={subject}
            onChange={(event) =>
              handleSubjectChange(
                event.target.value
              )
            }
          />

          <div className="flex items-center gap-2">
            <TagIcon
              size={13}
              style={{
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            />

            <input
              className="w-full text-xs"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text-muted)",
              }}
              placeholder="Tags, comma separated"
              value={tagsInput}
              onChange={(event) =>
                handleTagsInputChange(
                  event.target.value
                )
              }
            />
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      "var(--surface-2)",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main editor */}
        <div className="space-y-2">
          {blocks.map((block) => {
            if (
              block.type ===
              BLOCK_TYPES.NUMBERED
            ) {
              numberedCounter += 1;
            } else {
              numberedCounter = 0;
            }

            return (
              <div
                key={block.id}
                className="flex items-start gap-1.5"
              >
                {block.type ===
                  BLOCK_TYPES.DIVIDER ? (
                  <div
                    style={{
                      flex: 1,
                      borderTop:
                        "1px solid var(--border)",
                      margin: "12px 0",
                    }}
                  />
                ) : block.type ===
                  BLOCK_TYPES.IMAGE ? (
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    {block.dataUrl ? (
                      <div
                        style={{
                          position:
                            "relative",
                        }}
                      >
                        <img
                          src={block.dataUrl}
                          alt={
                            block.name || ""
                          }
                          style={{
                            maxWidth:
                              "100%",
                            borderRadius: 8,
                            display: "block",
                          }}
                        />

                        <button
                          onClick={() =>
                            handlePickImage(
                              block.id
                            )
                          }
                          className="mt-2 text-xs"
                          style={{
                            background:
                              "none",
                            border: "none",
                            color:
                              "var(--text-muted)",
                          }}
                        >
                          Replace image
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handlePickImage(
                            block.id
                          )
                        }
                        className="card p-4 w-full text-sm flex items-center justify-center gap-2"
                        style={{
                          color:
                            "var(--text-muted)",
                          border:
                            "1px dashed var(--border)",
                        }}
                      >
                        <ImageIcon size={16} />
                        Add an image
                      </button>
                    )}
                  </div>
                ) : block.type ===
                  BLOCK_TYPES.ATTACHMENT ? (
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    {block.name ? (
                      <div
                        className="card flex items-center gap-3 p-3"
                      >
                        <Paperclip
                          size={18}
                          style={{
                            color:
                              "var(--text-muted)",
                          }}
                        />

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <div className="text-sm truncate">
                            {block.name}
                          </div>

                          {block.size && (
                            <div
                              className="text-xs mt-0.5"
                              style={{
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              {Math.round(
                                block.size /
                                  1024
                              )}{" "}
                              KB
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            handlePickAttachment(
                              block.id
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color:
                              "var(--text-muted)",
                          }}
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handlePickAttachment(
                            block.id
                          )
                        }
                        className="card p-4 w-full text-sm flex items-center justify-center gap-2"
                        style={{
                          color:
                            "var(--text-muted)",
                          border:
                            "1px dashed var(--border)",
                        }}
                      >
                        <Paperclip size={16} />
                        Add attachment
                      </button>
                    )}
                  </div>
                ) : block.type ===
                  BLOCK_TYPES.LINK ? (
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      className="card p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Link2
                          size={16}
                          style={{
                            color:
                              "var(--text-muted)",
                          }}
                        />

                        <input
                          value={
                            block.url || ""
                          }
                          onChange={(event) => {
                            const next =
                              blocks.map(
                                (item) =>
                                  item.id ===
                                  block.id
                                    ? {
                                        ...item,
                                        url: event
                                          .target
                                          .value,
                                      }
                                    : item
                              );

                            updateBlocks(next);
                          }}
                          placeholder="https://..."
                          className="w-full text-sm"
                          style={{
                            background:
                              "none",
                            border: "none",
                            outline:
                              "none",
                            color:
                              "var(--text)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : block.type ===
                  BLOCK_TYPES.CODE ? (
                  <textarea
                    rows={4}
                    value={block.text || ""}
                    onFocus={() =>
                      setActiveBlockId(
                        block.id
                      )
                    }
                    onChange={(event) => {
                      handleBlockTextChange(
                        block.id,
                        event.target.value
                      );
                      autoGrow(
                        event.target
                      );
                    }}
                    placeholder="Write code..."
                    style={{
                      flex: 1,
                      background:
                        "var(--surface-2)",
                      border:
                        "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                      outline: "none",
                      resize: "none",
                      overflow: "hidden",
                      color:
                        "var(--text)",
                      fontFamily:
                        "monospace",
                      fontSize: 13,
                    }}
                  />
                ) : block.type ===
                  BLOCK_TYPES.TABLE ? (
                  <div
                    style={{
                      flex: 1,
                      overflowX: "auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse:
                          "collapse",
                      }}
                    >
                      <tbody>
                        {(block.rows || [
                          ["", ""],
                          ["", ""],
                        ]).map(
                          (row, rowIndex) => (
                            <tr
                              key={rowIndex}
                            >
                              {row.map(
                                (
                                  cell,
                                  columnIndex
                                ) => (
                                  <td
                                    key={
                                      columnIndex
                                    }
                                    style={{
                                      border:
                                        "1px solid var(--border)",
                                      padding: 8,
                                    }}
                                  >
                                    <input
                                      value={
                                        cell
                                      }
                                      onChange={(
                                        event
                                      ) => {
                                        const rows =
                                          (
                                            block.rows || [
                                              [
                                                "",
                                                "",
                                              ],
                                              [
                                                "",
                                                "",
                                              ],
                                            ]
                                          ).map(
                                            (
                                              currentRow
                                            ) =>
                                              [
                                                ...currentRow,
                                              ]
                                          );

                                        rows[
                                          rowIndex
                                        ][
                                          columnIndex
                                        ] =
                                          event
                                            .target
                                            .value;

                                        const next =
                                          blocks.map(
                                            (
                                              item
                                            ) =>
                                              item.id ===
                                              block.id
                                                ? {
                                                    ...item,
                                                    rows,
                                                  }
                                                : item
                                          );

                                        updateBlocks(
                                          next
                                        );
                                      }}
                                      style={{
                                        width:
                                          "100%",
                                        background:
                                          "none",
                                        border:
                                          "none",
                                        outline:
                                          "none",
                                        color:
                                          "var(--text)",
                                      }}
                                    />
                                  </td>
                                )
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : block.type ===
                  BLOCK_TYPES.DATE ? (
                  <div
                    className="card flex items-center gap-2 p-3"
                    style={{
                      flex: 1,
                    }}
                  >
                    <Calendar
                      size={16}
                      style={{
                        color:
                          "var(--text-muted)",
                      }}
                    />

                    <input
                      type="date"
                      value={
                        block.date ||
                        block.text ||
                        ""
                      }
                      onChange={(event) => {
                        const next =
                          blocks.map(
                            (item) =>
                              item.id ===
                              block.id
                                ? {
                                    ...item,
                                    date: event
                                      .target
                                      .value,
                                    text: event
                                      .target
                                      .value,
                                  }
                                : item
                          );

                        updateBlocks(next);
                      }}
                      style={{
                        background:
                          "none",
                        border: "none",
                        outline: "none",
                        color:
                          "var(--text)",
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {block.type ===
                      BLOCK_TYPES.CHECKLIST && (
                      <input
                        type="checkbox"
                        checked={
                          !!block.checked
                        }
                        onChange={() =>
                          handleToggleCheck(
                            block.id
                          )
                        }
                        style={{
                          marginTop: 10,
                        }}
                      />
                    )}

                    {block.type ===
                      BLOCK_TYPES.BULLET && (
                      <span
                        style={{
                          marginTop: 9,
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        •
                      </span>
                    )}

                    {block.type ===
                      BLOCK_TYPES.NUMBERED && (
                      <span
                        style={{
                          marginTop: 9,
                          color:
                            "var(--text-muted)",
                          fontSize: 13,
                          minWidth: 16,
                        }}
                      >
                        {numberedCounter}.
                      </span>
                    )}

                    <textarea
                      rows={1}
                      value={block.text || ""}
                      onFocus={(event) => {
                        setActiveBlockId(
                          block.id
                        );
                        autoGrow(
                          event.target
                        );
                      }}
                      onChange={(event) => {
                        handleBlockTextChange(
                          block.id,
                          event.target.value
                        );
                        autoGrow(
                          event.target
                        );
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey &&
                          block.type !==
                            BLOCK_TYPES.PARAGRAPH
                        ) {
                          event.preventDefault();

                          const newBlock =
                            handleAddBlock(
                              block.id,
                              block.type
                            );

                          setTimeout(() => {
                            const element =
                              document.querySelector(
                                `[data-block-id="${newBlock}"]`
                              );

                            element?.focus();
                          }, 0);

                          return;
                        }

                        if (
                          event.key ===
                            "Backspace" &&
                          !block.text &&
                          blocks.length > 1
                        ) {
                          event.preventDefault();
                          handleDeleteBlock(
                            block.id
                          );
                        }
                      }}
                      data-block-id={block.id}
                      placeholder={
                        block.type ===
                        BLOCK_TYPES.HEADING1
                          ? "Heading 1"
                          : block.type ===
                            BLOCK_TYPES.HEADING2
                          ? "Heading 2"
                          : "Type something..."
                      }
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        color:
                          "var(--text)",
                        lineHeight: 1.5,
                        fontFamily:
                          block.type ===
                            BLOCK_TYPES.HEADING1 ||
                          block.type ===
                            BLOCK_TYPES.HEADING2
                            ? "var(--font-display)"
                            : "inherit",
                        fontSize:
                          block.type ===
                          BLOCK_TYPES.HEADING1
                            ? 22
                            : block.type ===
                              BLOCK_TYPES.HEADING2
                            ? 18
                            : 15,
                        fontWeight:
                          block.type ===
                            BLOCK_TYPES.HEADING1 ||
                          block.type ===
                            BLOCK_TYPES.HEADING2
                            ? 700
                            : 400,
                        textDecoration:
                          block.type ===
                            BLOCK_TYPES.CHECKLIST &&
                          block.checked
                            ? "line-through"
                            : "none",
                        opacity:
                          block.type ===
                            BLOCK_TYPES.CHECKLIST &&
                          block.checked
                            ? 0.5
                            : 1,
                      }}
                    />
                  </>
                )}

                {/* Block controls */}
                <div
                  className="flex items-center gap-1"
                  style={{
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() =>
                      setMenuForBlockId(
                        menuForBlockId ===
                          block.id
                          ? null
                          : block.id
                      )
                    }
                    aria-label="Block type"
                    style={{
                      background:
                        "var(--surface-2)",
                      border: "none",
                      color:
                        "var(--text-muted)",
                      borderRadius: 6,
                      padding: 5,
                    }}
                  >
                    <Plus size={14} />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteBlock(
                        block.id
                      )
                    }
                    aria-label="Delete block"
                    style={{
                      background:
                        "var(--surface-2)",
                      border: "none",
                      color:
                        "var(--text-muted)",
                      borderRadius: 6,
                      padding: 5,
                    }}
                  >
                    <XIcon size={13} />
                  </button>

                  {menuForBlockId ===
                    block.id && (
                    <>
                      <div
                        onClick={() =>
                          setMenuForBlockId(
                            null
                          )
                        }
                        style={{
                          position:
                            "fixed",
                          inset: 0,
                          zIndex: 19,
                        }}
                      />

                      <div
                        className="card"
                        style={{
                          position:
                            "absolute",
                          top: "100%",
                          right: 0,
                          zIndex: 20,
                          width: 190,
                          maxHeight: 360,
                          overflowY:
                            "auto",
                          padding: 6,
                        }}
                      >
                        {BLOCK_MENU.map(
                          (item) => (
                            <button
                              key={
                                item.type
                              }
                              onClick={() =>
                                handleChangeBlockType(
                                  block.id,
                                  item.type
                                )
                              }
                              className="flex items-center gap-2 w-full text-left text-xs py-2 px-2 rounded"
                              style={{
                                background:
                                  "none",
                                border:
                                  "none",
                                color:
                                  "var(--text)",
                              }}
                            >
                              <item.icon
                                size={14}
                              />
                              {item.label}
                            </button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom formatting toolbar */}
        <div
          className="flex items-center justify-center gap-1 mt-5 p-2 rounded-xl"
          style={{
            position: "sticky",
            bottom: 12,
            background:
              "var(--surface)",
            border:
              "1px solid var(--border)",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.25)",
            zIndex: 10,
          }}
        >
          {/* Insert */}
          <div
            style={{
              position: "relative",
            }}
          >
            <button
              onClick={() =>
                setInsertMenuOpen(
                  (value) => !value
                )
              }
              aria-label="Insert"
              className="p-2.5 rounded-lg"
              style={{
                background: "none",
                border: "none",
                color:
                  "var(--text-muted)",
              }}
            >
              <Plus size={18} />
            </button>

            {insertMenuOpen && (
              <>
                <div
                  onClick={() =>
                    setInsertMenuOpen(
                      false
                    )
                  }
                  style={{
                    position:
                      "fixed",
                    inset: 0,
                    zIndex: 19,
                  }}
                />

                <div
                  className="card"
                  style={{
                    position:
                      "absolute",
                    bottom:
                      "calc(100% + 8px)",
                    left: 0,
                    width: 220,
                    maxHeight: 400,
                    overflowY:
                      "auto",
                    padding: 6,
                    zIndex: 20,
                  }}
                >
                  {BLOCK_MENU.map(
                    (item) => (
                      <button
                        key={item.type}
                        onClick={() =>
                          handleInsertType(
                            item.type
                          )
                        }
                        className="flex items-center gap-2.5 w-full text-left p-2.5 rounded-lg text-sm"
                        style={{
                          background:
                            "none",
                          border: "none",
                          color:
                            "var(--text)",
                        }}
                      >
                        <item.icon
                          size={16}
                        />
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* Text */}
          <button
            onClick={() =>
              addBlockFromToolbar(
                BLOCK_TYPES.PARAGRAPH
              )
            }
            aria-label="Text"
            className="p-2.5 rounded-lg"
            style={{
              background: "none",
              border: "none",
              color:
                "var(--text-muted)",
            }}
          >
            <Type size={18} />
          </button>

          {/* Image */}
          <button
            onClick={
              handleAddImageFromToolbar
            }
            aria-label="Image"
            className="p-2.5 rounded-lg"
            style={{
              background: "none",
              border: "none",
              color:
                "var(--text-muted)",
            }}
          >
            <ImageIcon size={18} />
          </button>

          {/* Attachment */}
          <button
            onClick={
              handleAddAttachmentFromToolbar
            }
            aria-label="Attachment"
            className="p-2.5 rounded-lg"
            style={{
              background: "none",
              border: "none",
              color:
                "var(--text-muted)",
            }}
          >
            <Paperclip size={18} />
          </button>

          {/* Checklist */}
          <button
            onClick={() =>
              addBlockFromToolbar(
                BLOCK_TYPES.CHECKLIST
              )
            }
            aria-label="Checklist"
            className="p-2.5 rounded-lg"
            style={{
              background: "none",
              border: "none",
              color:
                "var(--text-muted)",
            }}
          >
            <CheckSquare size={18} />
          </button>

          {/* More */}
          <button
            onClick={() =>
              setInsertMenuOpen(true)
            }
            aria-label="More formatting"
            className="p-2.5 rounded-lg"
            style={{
              background: "none",
              border: "none",
              color:
                "var(--text-muted)",
            }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}