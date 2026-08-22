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

  try {
    const communities = await prisma.community.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
    });

    const formatted = communities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      iconDataUrl: c.iconDataUrl,
      bannerDataUrl: c.bannerDataUrl,
      category: c.category,
      tags: c.tags,
      accentColor: c.accentColor,
      joinMode: c.joinMode,
      discoverable: c.discoverable,
      welcomeMessage: c.welcomeMessage,
      isOwner: c.ownerId === userId,
      isAdmin: c.adminIds.includes(userId),
      isMember: c.memberIds.includes(userId),
      memberCount: c.memberIds.length,
    }));

    return NextResponse.json({ communities: formatted });
  } catch (err) {
    console.error("GET /api/communities error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim();
    const category = (body.category || "").trim();
    const iconDataUrl = typeof body.iconDataUrl === "string" ? body.iconDataUrl : null;
    const bannerDataUrl = typeof body.bannerDataUrl === "string" ? body.bannerDataUrl : null;
    const isPublic = body.visibility !== "private";

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
        category: category || null,
        iconDataUrl: iconDataUrl || null,
        bannerDataUrl: bannerDataUrl || null,
        joinMode: isPublic ? "anyone" : "invite_only",
        discoverable: isPublic,
        ownerId: userId,
        memberIds: [userId],
      },
    });

    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description,
        iconDataUrl: community.iconDataUrl,
        bannerDataUrl: community.bannerDataUrl,
        category: community.category,
        tags: community.tags,
        accentColor: community.accentColor,
        joinMode: community.joinMode,
        discoverable: community.discoverable,
        welcomeMessage: community.welcomeMessage,
        isOwner: true,
        isAdmin: false,
        isMember: true,
        memberCount: community.memberIds.length,
      },
    });
  } catch (err) {
    console.error("POST /api/communities error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}