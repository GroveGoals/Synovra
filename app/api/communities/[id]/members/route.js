import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const members = await prisma.user.findMany({
      where: { id: { in: community.memberIds } },
      select: { id: true, username: true, avatarDataUrl: true, online: true },
    });

    const formatted = members.map((m) => ({
      ...m,
      isOwner: m.id === community.ownerId,
    }));

    return NextResponse.json({ members: formatted });
  } catch (err) {
    console.error("GET /api/communities/[id]/members error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}