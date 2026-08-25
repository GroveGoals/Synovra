import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const folder = await prisma.folder.findUnique({ where: { id: params.folderId } });
  if (!folder || folder.userId !== user.id) {
    return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  const updated = await prisma.folder.update({
    where: { id: params.folderId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ ok: true, folder: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const folder = await prisma.folder.findUnique({ where: { id: params.folderId } });
  if (!folder || folder.userId !== user.id) {
    return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  // Notes in this folder become unfiled, not deleted — Note.folderId is onDelete: SetNull.
  await prisma.folder.delete({ where: { id: params.folderId } });
  return NextResponse.json({ ok: true });
}