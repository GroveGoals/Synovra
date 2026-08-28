"use client";
import ReactMarkdown from "react-markdown";

export default function MarkdownText({ text }) {
  return (
    <div
      style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)" }}
      className="vreedits-markdown"
    >
      <style>{`
        .vreedits-markdown h1, .vreedits-markdown h2, .vreedits-markdown h3 {
          font-family: var(--font-display);
          font-weight: 600;
          margin: 14px 0 6px;
        }
        .vreedits-markdown h1 { font-size: 18px; }
        .vreedits-markdown h2 { font-size: 16px; }
        .vreedits-markdown h3 { font-size: 14px; }
        .vreedits-markdown p { margin: 0 0 10px; }
        .vreedits-markdown ul, .vreedits-markdown ol { margin: 0 0 10px; padding-left: 20px; }
        .vreedits-markdown li { margin-bottom: 4px; }
        .vreedits-markdown strong { font-weight: 600; }
        .vreedits-markdown code {
          background: var(--surface-2);
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 13px;
        }
      `}</style>
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}