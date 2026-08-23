import { redirect, notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import FlashcardDeckClient from "@/components/FlashcardDeckClient";

export default async function FlashcardDeckPage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  const deck = await prisma.flashcardDeck.findUnique({ where: { id: params.deckId } });
  if (!deck || deck.userId !== userId) notFound();

  return (
    <NavShell user={user}>
      <FlashcardDeckClient deckId={params.deckId} />
    </NavShell>
  );
}