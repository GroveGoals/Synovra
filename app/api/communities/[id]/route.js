import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatarDataUrl: true,
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isMember = community.memberIds.includes(userId);
    const isOwner = community.ownerId === userId;

    return NextResponse.json({
      ...community,
      isMember,
      isOwner,
      memberCount: community.memberIds.length,
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}