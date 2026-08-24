import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: params.deckId },
    include: { cards: { orderBy: { createdAt: "asc" } } },
  });

  if (!deck || deck.userId !== user.id) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deck });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const deck = await prisma.flashcardDeck.findUnique({ where: { id: params.deckId } });
  if (!deck || deck.userId !== user.id) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  await prisma.flashcardDeck.delete({ where: { id: params.deckId } });
  return NextResponse.json({ ok: true });
}