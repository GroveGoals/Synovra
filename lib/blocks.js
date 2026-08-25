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
};

// Block types that carry a "text" field the user types into directly,
// and support Enter-to-create-next-block / Backspace-to-merge behavior.
export const TEXT_BLOCK_TYPES = [
  BLOCK_TYPES.PARAGRAPH,
  BLOCK_TYPES.HEADING1,
  BLOCK_TYPES.HEADING2,
  BLOCK_TYPES.BULLET,
  BLOCK_TYPES.NUMBERED,
  BLOCK_TYPES.CHECKLIST,
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
    default:
      return { ...base, text: "", ...overrides };
  }
}

export function emptyDoc() {
  return [createBlock(BLOCK_TYPES.PARAGRAPH)];
}