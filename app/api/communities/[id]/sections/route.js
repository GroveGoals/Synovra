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
    const sections = await prisma.section.findMany({
      where: { communityId: params.id },
      orderBy: { order: "asc" },
      include: { channels: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ sections });
  } catch (err) {
    console.error("GET /api/communities/[id]/sections error:", err);
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
      return NextResponse.json({ error: "You don't have permission to add sections." }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Section name is required." }, { status: 400 });

    const count = await prisma.section.count({ where: { communityId: params.id } });
    const section = await prisma.section.create({
      data: { communityId: params.id, name, order: count },
    });

    return NextResponse.json({ section: { ...section, channels: [] } });
  } catch (err) {
    console.error("POST /api/communities/[id]/sections error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}