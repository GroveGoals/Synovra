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
    const rules = await prisma.rule.findMany({
      where: { communityId: params.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ rules });
  } catch (err) {
    console.error("GET /api/communities/[id]/rules error:", err);
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
      return NextResponse.json({ error: "You don't have permission to add rules." }, { status: 403 });
    }

    const body = await request.json();
    const text = (body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Rule text is required." }, { status: 400 });

    const count = await prisma.rule.count({ where: { communityId: params.id } });
    const rule = await prisma.rule.create({
      data: { communityId: params.id, text, order: count },
    });

    return NextResponse.json({ rule });
  } catch (err) {
    console.error("POST /api/communities/[id]/rules error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}