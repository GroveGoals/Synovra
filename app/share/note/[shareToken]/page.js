import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NoteBlocksReadOnly from "@/components/NoteBlocksReadOnly";
import { FileText } from "lucide-react";

export default async function SharedNotePage({ params }) {
  const note = await prisma.note.findUnique({ where: { shareToken: params.shareToken } });
  if (!note) notFound();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[560px] mt-10">
        <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Shared note · Vreedits
        </div>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {note.title || "Untitled"}
          </h1>
        </div>
        {note.subject && <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{note.subject}</p>}
        <NoteBlocksReadOnly blocks={Array.isArray(note.content) ? note.content : []} />
      </div>
    </div>
  );
}