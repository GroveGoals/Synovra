import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversations = await prisma.tutorConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, conversations });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { messages } = await req.json().catch(() => ({}));
  const firstUserText = messages?.find((m) => m.role === "user")?.text?.trim();
  const title = firstUserText ? firstUserText.slice(0, 50) : "New Tutoring Session";

  const conversation = await prisma.tutorConversation.create({
    data: { userId: user.id, title, messages: messages || [] },
  });

  return NextResponse.json({ ok: true, conversation });
}