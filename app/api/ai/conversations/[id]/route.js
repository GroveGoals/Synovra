import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

async function loadOwned(id, userId) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || conversation.userId !== userId) return null;
  return conversation;
}

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversation = await loadOwned(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ conversation });
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { messages } = await req.json();
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages." }, { status: 400 });
  }

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data: { messages },
  });

  return NextResponse.json({ ok: true, conversation: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.conversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}