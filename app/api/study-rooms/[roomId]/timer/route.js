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

  const { durationMinutes } = await req.json().catch(() => ({}));
  const minutes = Number(durationMinutes);
  if (!minutes || minutes <= 0 || minutes > 240) {
    return NextResponse.json({ error: "Enter a duration between 1 and 240 minutes." }, { status: 400 });
  }

  const room = await prisma.studyRoom.update({
    where: { id: params.roomId },
    data: { timerStartedAt: new Date(), timerDurationMinutes: minutes },
  });

  return NextResponse.json({ ok: true, room });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const membership = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: user.id } },
  });
  if (!membership || membership.status === "left") {
    return NextResponse.json({ error: "You're not part of this room." }, { status: 403 });
  }

  const room = await prisma.studyRoom.update({
    where: { id: params.roomId },
    data: { timerStartedAt: null, timerDurationMinutes: null },
  });

  return NextResponse.json({ ok: true, room });
}