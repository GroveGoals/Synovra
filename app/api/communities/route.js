import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  const communities = await prisma.community.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
  });

  const formatted = communities.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    iconDataUrl: c.iconDataUrl,
    isOwner: c.ownerId === userId,
    isMember: c.memberIds.includes(userId),
    memberCount: c.memberIds.length,
  }));

  return NextResponse.json({ communities: formatted });
}

export async function POST(request) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = (body.name || "").trim();
  const description = (body.description || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Community name is required." }, { status: 400 });
  }

  const existing = await prisma.community.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "A community with that name already exists." }, { status: 409 });
  }

  const community = await prisma.community.create({
    data: {
      name,
      description: description || null,
      ownerId: userId,
      memberIds: [userId],
    },
  });

  return NextResponse.json({
    community: {
      id: community.id,
      name: community.name,
      description: community.description,
      iconDataUrl: community.iconDataUrl,
      isOwner: true,
      isMember: true,
      memberCount: community.memberIds.length,
    },
  });
}