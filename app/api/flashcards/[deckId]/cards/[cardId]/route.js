import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["new", "known", "review"];

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const card = await prisma.flashcard.findUnique({
    where: { id: params.cardId },
    include: { deck: true },
  });

  if (!card || card.deck.userId !== user.id || card.deckId !== params.deckId) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const updated = await prisma.flashcard.update({
    where: { id: params.cardId },
    data: { status },
  });

  return NextResponse.json({ ok: true, card: updated });
}