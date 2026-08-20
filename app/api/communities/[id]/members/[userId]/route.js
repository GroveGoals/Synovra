import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request, { params }) {
  const requesterId = getSessionUserId();
  if (!requesterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (community.ownerId !== requesterId) {
      return NextResponse.json({ error: "Only the owner can remove members." }, { status: 403 });
    }
    if (params.userId === community.ownerId) {
      return NextResponse.json({ error: "Owner can't be removed." }, { status: 400 });
    }

    await prisma.community.update({
      where: { id: params.id },
      data: { memberIds: community.memberIds.filter((id) => id !== params.userId) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/members/[userId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}