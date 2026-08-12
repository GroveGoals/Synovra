import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

async function loadOwned(id, userId) {
  const item = await prisma.toolRun.findUnique({ where: { id } });
  if (!item || item.userId !== userId) return null;
  return item;
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const data = {};
  if (typeof body.favorited === "boolean") data.favorited = body.favorited;
  if ("collectionId" in body) data.collectionId = body.collectionId || null;

  const updated = await prisma.toolRun.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.toolRun.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}