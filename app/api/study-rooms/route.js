import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const memberships = await prisma.studyRoomMember.findMany({
    where: { userId: user.id, status: { not: "left" } },
    include: {
      room: {
        include: {
          host: { select: { id: true, username: true, displayName: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { room: { createdAt: "desc" } },
  });

  const rooms = memberships
    .filter((m) => m.room.status === "active")
    .map((m) => ({ ...m.room, myStatus: m.status }));

  return NextResponse.json({ ok: true, rooms });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { name, subject } = await req.json().catch(() => ({}));
  if (!name?.trim()) {
    return NextResponse.json({ error: "Room name is required." }, { status: 400 });
  }

  const room = await prisma.studyRoom.create({
    data: {
      hostId: user.id,
      name: name.trim(),
      subject: subject?.trim() || null,
      members: { create: { userId: user.id, status: "studying" } },
    },
    include: { host: { select: { id: true, username: true, displayName: true } } },
  });

  return NextResponse.json({ ok: true, room });
}
