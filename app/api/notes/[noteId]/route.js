import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

const EDITABLE_FIELDS = [
  "title", "coverImageUrl", "subject", "tags", "content",
  "pinned", "folderId", "isAssignment", "dueDate", "submitted",
];

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const note = await prisma.note.findUnique({ where: { id: params.noteId } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, note });
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const note = await prisma.note.findUnique({ where: { id: params.noteId } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.note.update({ where: { id: params.noteId }, data });
  return NextResponse.json({ ok: true, note: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const note = await prisma.note.findUnique({ where: { id: params.noteId } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: params.noteId } });
  return NextResponse.json({ ok: true });
}