export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const BLOCK_TYPES = {
  PARAGRAPH: "paragraph",
  HEADING1: "heading1",
  HEADING2: "heading2",
  BULLET: "bulletItem",
  NUMBERED: "numberedItem",
  CHECKLIST: "checklistItem",
  IMAGE: "image",
  FILE: "file",
  DIVIDER: "divider",
  TABLE: "table",
  CODE: "code",
  DATE: "date",
};

export const TEXT_BLOCK_TYPES = [
  BLOCK_TYPES.PARAGRAPH,
  BLOCK_TYPES.HEADING1,
  BLOCK_TYPES.HEADING2,
  BLOCK_TYPES.BULLET,
  BLOCK_TYPES.NUMBERED,
  BLOCK_TYPES.CHECKLIST,
];

// Types with no meaningful "empty text -> backspace deletes" behavior,
// so they get their own explicit delete button in the UI instead.
export const NON_TEXT_TYPES = [
  BLOCK_TYPES.IMAGE,
  BLOCK_TYPES.FILE,
  BLOCK_TYPES.DIVIDER,
  BLOCK_TYPES.TABLE,
  BLOCK_TYPES.CODE,
  BLOCK_TYPES.DATE,
];

export function createBlock(type, overrides = {}) {
  const base = { id: uid(), type };
  switch (type) {
    case BLOCK_TYPES.CHECKLIST:
      return { ...base, text: "", checked: false, ...overrides };
    case BLOCK_TYPES.IMAGE:
      return { ...base, dataUrl: "", name: "", ...overrides };
    case BLOCK_TYPES.FILE:
      return { ...base, dataUrl: "", name: "", ...overrides };
    case BLOCK_TYPES.DIVIDER:
      return { ...base, ...overrides };
    case BLOCK_TYPES.TABLE:
      return { ...base, rows: [["", ""], ["", ""]], ...overrides };
    case BLOCK_TYPES.CODE:
      return { ...base, text: "", ...overrides };
    case BLOCK_TYPES.DATE:
      return { ...base, date: "", ...overrides };
    default:
      return { ...base, text: "", ...overrides };
  }
}

export function emptyDoc() {
  return [createBlock(BLOCK_TYPES.PARAGRAPH)];
}

// Pulls plain text and image attachments out of a note's block content,
// in the shape /api/flashcards/generate and /api/study-tools/generate expect.
export function extractNoteContent(blocks) {
  const textParts = [];
  const images = [];

  for (const block of blocks || []) {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
      case BLOCK_TYPES.HEADING2:
      case BLOCK_TYPES.PARAGRAPH:
        if (block.text?.trim()) textParts.push(block.text.trim());
        break;
      case BLOCK_TYPES.BULLET:
      case BLOCK_TYPES.NUMBERED:
      case BLOCK_TYPES.CHECKLIST:
        if (block.text?.trim()) textParts.push(`- ${block.text.trim()}`);
        break;
      case BLOCK_TYPES.TABLE:
        if (Array.isArray(block.rows)) {
          textParts.push(block.rows.map((row) => row.join(" | ")).join("\n"));
        }
        break;
      case BLOCK_TYPES.CODE:
        if (block.text?.trim()) textParts.push(`Code:\n${block.text.trim()}`);
        break;
      case BLOCK_TYPES.DATE:
        if (block.date) textParts.push(`Date: ${block.date}`);
        break;
      case BLOCK_TYPES.IMAGE:
        if (block.dataUrl) {
          const match = block.dataUrl.match(/^data:([^;]+);/);
          images.push({
            dataUrl: block.dataUrl,
            name: block.name || "image",
            type: match?.[1] || "image/png",
          });
        }
        break;
      default:
        break;
    }
  }

  return { text: textParts.join("\n"), images };
}