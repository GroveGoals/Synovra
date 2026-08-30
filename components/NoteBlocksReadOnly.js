"use client";
import { Paperclip } from "lucide-react";
import { BLOCK_TYPES } from "@/lib/blocks";

export default function NoteBlocksReadOnly({ blocks }) {
  return (
    <div className="space-y-3">
      {blocks.map((block) => {
        switch (block.type) {
          case BLOCK_TYPES.HEADING1:
            return block.text ? <h2 key={block.id} style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}>{block.text}</h2> : null;
          case BLOCK_TYPES.HEADING2:
            return block.text ? <h3 key={block.id} style={{ fontSize: 18, fontWeight: 600 }}>{block.text}</h3> : null;
          case BLOCK_TYPES.BULLET:
            return block.text ? <div key={block.id} className="flex items-start gap-2 text-sm"><span>•</span><span>{block.text}</span></div> : null;
          case BLOCK_TYPES.NUMBERED:
            return block.text ? <div key={block.id} className="flex items-start gap-2 text-sm"><span style={{ color: "var(--text-muted)" }}>–</span><span>{block.text}</span></div> : null;
          case BLOCK_TYPES.CHECKLIST:
            return block.text ? (
              <div key={block.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={!!block.checked} readOnly style={{ marginTop: 3 }} />
                <span style={{ textDecoration: block.checked ? "line-through" : "none", color: block.checked ? "var(--text-muted)" : "var(--text)" }}>{block.text}</span>
              </div>
            ) : null;
          case BLOCK_TYPES.IMAGE:
            return block.dataUrl ? <img key={block.id} src={block.dataUrl} alt="" style={{ maxWidth: "100%", borderRadius: 10 }} /> : null;
          case BLOCK_TYPES.FILE:
            return block.dataUrl ? (
              <div key={block.id} className="flex items-center gap-2 p-2 rounded-lg text-sm" style={{ background: "var(--surface-2)" }}>
                <Paperclip size={14} style={{ color: "var(--text-muted)" }} />
                <a href={block.dataUrl} download={block.name}>{block.name}</a>
              </div>
            ) : null;
          case BLOCK_TYPES.DIVIDER:
            return <hr key={block.id} style={{ border: "none", borderTop: "1px solid var(--border)" }} />;
          case BLOCK_TYPES.TABLE:
            return (
              <table key={block.id} style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  {(block.rows || []).map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ border: "1px solid var(--border)", padding: "6px 8px", fontSize: 13 }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case BLOCK_TYPES.CODE:
            return block.text ? (
              <pre key={block.id} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontSize: 13, overflowX: "auto" }}>{block.text}</pre>
            ) : null;
          case BLOCK_TYPES.DATE:
            return block.date ? <div key={block.id} className="text-sm" style={{ color: "var(--text-muted)" }}>📅 {block.date}</div> : null;
          default:
            return block.text ? <p key={block.id} className="text-sm" style={{ lineHeight: 1.6 }}>{block.text}</p> : null;
        }
      })}
    </div>
  );
}