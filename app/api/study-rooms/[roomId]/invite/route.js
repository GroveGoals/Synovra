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

  const { username } = await req.json().catch(() => ({}));
  if (!username?.trim()) {
    return NextResponse.json({ error: "Enter a username." }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (!invitee) {
    return NextResponse.json({ error: `No user found with username "${username.trim()}".` }, { status: 404 });
  }

  const existing = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: invitee.id } },
  });
  if (existing && existing.status !== "left") {
    return NextResponse.json({ error: `${invitee.username} is already in this room.` }, { status: 400 });
  }

  const member = existing
    ? await prisma.studyRoomMember.update({
        where: { id: existing.id },
        data: { status: "invited" },
      })
    : await prisma.studyRoomMember.create({
        data: { roomId: params.roomId, userId: invitee.id, status: "invited" },
      });

  return NextResponse.json({ ok: true, member });
}