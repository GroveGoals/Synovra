import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

async function loadOwnedDeck(id, userId) {
  const deck = await prisma.flashcardDeck.findUnique({
    where: { id },
    include: { cards: { orderBy: { createdAt: "asc" } } },
  });
  if (!deck || deck.userId !== userId) return null;
  return deck;
}

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const deck = await loadOwnedDeck(params.id, user.id);
  if (!deck) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ deck });
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwnedDeck(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { title, subject } = await req.json();
  const deck = await prisma.flashcardDeck.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(subject !== undefined ? { subject: subject?.trim() || null } : {}),
    },
  });

  return NextResponse.json({ ok: true, deck });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwnedDeck(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.flashcardDeck.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}