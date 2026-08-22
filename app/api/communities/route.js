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
      isOwner: c.ownerId === userId,
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
    const category = typeof body.category === "string" ? body.category.trim() || null : null;
    const iconDataUrl = typeof body.iconDataUrl === "string" ? body.iconDataUrl || null : null;
    const bannerDataUrl = typeof body.bannerDataUrl === "string" ? body.bannerDataUrl || null : null;

    if (!name) {
      return NextResponse.json({ error: "Community name is required." }, { status: 400 });
    }

    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "A community with that name already exists." }, { status: 409 });
    }

    // Map the wizard's simple public/private choice onto joinMode + discoverable
    const joinMode = body.visibility === "private" ? "invite_only" : "anyone";
    const discoverable = body.visibility !== "private";

    const community = await prisma.community.create({
      data: {
        name,
        description: description || null,
        category,
        iconDataUrl,
        bannerDataUrl,
        joinMode,
        discoverable,
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
        bannerDataUrl: community.bannerDataUrl,
        category: community.category,
        isOwner: true,
        isMember: true,
        memberCount: community.memberIds.length,
      },
    });
  } catch (err) {
    console.error("POST /api/communities error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}