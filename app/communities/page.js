import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const communities = await prisma.community.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const communitiesWithMembership = communities.map(community => ({
      ...community,
      isMember: community.memberIds.includes(userId),
      isOwner: community.ownerId === userId,
      memberCount: community.memberIds.length,
    }));

    return NextResponse.json({ communities: communitiesWithMembership });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Community name is required" }, { status: 400 });
    }

    const existing = await prisma.community.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Community name already exists" }, { status: 400 });
    }

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: userId,
        memberIds: [userId],
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}