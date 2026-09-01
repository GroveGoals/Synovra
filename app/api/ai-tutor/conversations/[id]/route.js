import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversation = await prisma.tutorConversation.findUnique({ where: { id: params.id } });
  if (!conversation || conversation.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, conversation });
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversation = await prisma.tutorConversation.findUnique({ where: { id: params.id } });
  if (!conversation || conversation.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { messages } = await req.json().catch(() => ({}));
  const updated = await prisma.tutorConversation.update({
    where: { id: params.id },
    data: { messages: messages ?? conversation.messages },
  });

  return NextResponse.json({ ok: true, conversation: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversation = await prisma.tutorConversation.findUnique({ where: { id: params.id } });
  if (!conversation || conversation.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.tutorConversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}