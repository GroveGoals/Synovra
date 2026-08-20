import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const channels = await prisma.channel.findMany({
      where: { communityId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ channels });
  } catch (err) {
    console.error("GET /api/communities/[id]/channels error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to add channels." }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return NextResponse.json({ error: "Channel name is required." }, { status: 400 });

    const channel = await prisma.channel.create({
      data: { communityId: params.id, name },
    });

    return NextResponse.json({ channel });
  } catch (err) {
    console.error("POST /api/communities/[id]/channels error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}