import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

async function loadOwnedCard(id, userId) {
  const card = await prisma.flashcard.findUnique({
    where: { id },
    include: { deck: true },
  });
  if (!card || card.deck.userId !== userId) return null;
  return card;
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwnedCard(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { front, back } = await req.json();
  const card = await prisma.flashcard.update({
    where: { id: params.id },
    data: {
      ...(front !== undefined ? { front: front.trim() } : {}),
      ...(back !== undefined ? { back: back.trim() } : {}),
    },
  });

  return NextResponse.json({ ok: true, card });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwnedCard(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.flashcard.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}