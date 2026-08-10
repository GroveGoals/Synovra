"use client";
import ReactMarkdown from "react-markdown";

export default function MarkdownText({ text }) {
  return (
    <div
      style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)" }}
      className="synovra-markdown"
    >
      <style>{`
        .synovra-markdown h1, .synovra-markdown h2, .synovra-markdown h3 {
          font-family: var(--font-display);
          font-weight: 600;
          margin: 14px 0 6px;
        }
        .synovra-markdown h1 { font-size: 18px; }
        .synovra-markdown h2 { font-size: 16px; }
        .synovra-markdown h3 { font-size: 14px; }
        .synovra-markdown p { margin: 0 0 10px; }
        .synovra-markdown ul, .synovra-markdown ol { margin: 0 0 10px; padding-left: 20px; }
        .synovra-markdown li { margin-bottom: 4px; }
        .synovra-markdown strong { font-weight: 600; }
        .synovra-markdown code {
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