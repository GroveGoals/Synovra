import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const userId = getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const community = await prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.memberIds.includes(userId)) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    const updated = await prisma.community.update({
      where: { id },
      data: {
        memberIds: {
          push: userId,
        },
      },
    });

    return NextResponse.json({ success: true, memberCount: updated.memberIds.length });
  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const community = await prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (!community.memberIds.includes(userId)) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // Can't leave if you're the owner
    if (community.ownerId === userId) {
      return NextResponse.json({ error: "Owner cannot leave their own community" }, { status: 400 });
    }

    const updated = await prisma.community.update({
      where: { id },
      data: {
        memberIds: {
          set: community.memberIds.filter(id => id !== userId),
        },
      },
    });

    return NextResponse.json({ success: true, memberCount: updated.memberIds.length });
  } catch (error) {
    console.error("Error leaving community:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}