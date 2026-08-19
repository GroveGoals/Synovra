import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        iconDataUrl: community.iconDataUrl,
        isOwner: community.ownerId === userId,
        isMember: community.memberIds.includes(userId),
        memberCount: community.memberIds.length,
      },
    });
  } catch (err) {
    console.error("GET /api/communities/[id] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (community.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can delete this community." }, { status: 403 });
    }

    await prisma.community.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}