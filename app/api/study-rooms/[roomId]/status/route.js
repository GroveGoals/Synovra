import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["studying", "break", "left"];

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { status } = await req.json().catch(() => ({}));
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const membership = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: user.id } },
    include: { room: true },
  });
  if (!membership) return NextResponse.json({ error: "You're not part of this room." }, { status: 403 });

  if (status === "left") {
    const minutes = Math.max(1, Math.round((Date.now() - membership.joinedAt.getTime()) / 60000));
    await prisma.studySession.create({
      data: {
        userId: user.id,
        subject: membership.room.subject || membership.room.name,
        minutes,
        note: `Study Room: ${membership.room.name}`,
      },
    });
  }

  const updated = await prisma.studyRoomMember.update({
    where: { id: membership.id },
    data: { status, lastActiveAt: new Date() },
  });

  return NextResponse.json({ ok: true, member: updated });
}