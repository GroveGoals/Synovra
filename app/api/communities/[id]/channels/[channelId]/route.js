import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to rename channels." }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return NextResponse.json({ error: "Channel name is required." }, { status: 400 });

    const channel = await prisma.channel.update({
      where: { id: params.channelId },
      data: { name },
    });

    return NextResponse.json({ channel });
  } catch (err) {
    console.error("PATCH /api/communities/[id]/channels/[channelId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to delete channels." }, { status: 403 });
    }

    await prisma.channel.delete({ where: { id: params.channelId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/channels/[channelId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}