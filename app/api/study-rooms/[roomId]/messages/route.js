import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function POST(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const membership = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: user.id } },
  });
  if (!membership || membership.status === "left") {
    return NextResponse.json({ error: "You're not part of this room." }, { status: 403 });
  }

  const { text } = await req.json().catch(() => ({}));
  if (!text?.trim()) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  const message = await prisma.studyRoomMessage.create({
    data: { roomId: params.roomId, userId: user.id, text: text.trim().slice(0, 1000) },
    include: { user: { select: { id: true, username: true } } },
  });

  return NextResponse.json({ ok: true, message });
}