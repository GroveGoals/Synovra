import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function POST(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const deck = await prisma.flashcardDeck.findUnique({ where: { id: params.id } });
  if (!deck || deck.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { front, back } = await req.json();
  if (!front?.trim() || !back?.trim()) {
    return NextResponse.json({ error: "Both sides of the card are required." }, { status: 400 });
  }

  const card = await prisma.flashcard.create({
    data: { deckId: deck.id, front: front.trim(), back: back.trim() },
  });

  return NextResponse.json({ ok: true, card });
}