import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

async function loadOwned(id, userId) {
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== userId) return null;
  return collection;
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { name } = await req.json();
  const cleanName = (name || "").trim();
  if (!cleanName) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const updated = await prisma.collection.update({
    where: { id: params.id },
    data: { name: cleanName },
  });
  return NextResponse.json({ ok: true, collection: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.collection.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}