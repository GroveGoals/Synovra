import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const [notes, toolRuns, conversations] = await Promise.all([
    prisma.note.findMany({
      where: { userId: user.id, pinned: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.toolRun.findMany({
      where: { userId: user.id, favorited: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversation.findMany({
      where: { userId: user.id, pinned: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const groups = [
    {
      key: "school",
      label: "School",
      items: notes.map((n) => ({
        id: n.id,
        title: n.title || "Untitled",
        subtitle: n.subject || null,
        href: `/notes/${n.id}`,
        updatedAt: n.updatedAt,
      })),
    },
    {
      key: "ai-tools",
      label: "AI Tools",
      items: toolRuns.map((t) => ({
        id: t.id,
        title: t.toolLabel,
        subtitle: t.inputSummary,
        href: `/ai-tools/${t.toolId}`,
        updatedAt: t.createdAt,
      })),
    },
    {
      key: "syna-chats",
      label: "Syna Chats",
      items: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: null,
        href: `/ai-tools/syna?id=${c.id}`,
        updatedAt: c.updatedAt,
      })),
    },
  ].filter((g) => g.items.length > 0);

  return NextResponse.json({ ok: true, groups });
}