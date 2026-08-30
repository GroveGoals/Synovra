import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { emptyDoc } from "@/lib/blocks";

export async function GET(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const favoritesOnly = searchParams.get("favorites") === "1";
  const assignmentsOnly = searchParams.get("assignments") === "1";
  const sharedOnly = searchParams.get("shared") === "1";
  const recentOnly = searchParams.get("recent") === "1";

  const notes = await prisma.note.findMany({
    where: {
      userId: user.id,
      ...(folderId ? { folderId } : {}),
      ...(favoritesOnly ? { pinned: true } : {}),
      ...(assignmentsOnly ? { isAssignment: true } : {}),
      ...(sharedOnly ? { shareToken: { not: null } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    ...(recentOnly ? { take: 10 } : {}),
  });

  return NextResponse.json({ ok: true, notes });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title: body.title?.trim() || "Untitled",
      subject: body.subject?.trim() || null,
      isAssignment: !!body.isAssignment,
      dueDate: body.dueDate || null,
      folderId: body.folderId || null,
      content: body.content || emptyDoc(),
    },
  });

  return NextResponse.json({ ok: true, note });
}