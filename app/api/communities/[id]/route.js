import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const userId = getSessionUserId();
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

export async function PUT(request, { params }) {
  try {
    const userId = getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, iconDataUrl } = body;

    const community = await prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can edit this community" }, { status: 403 });
    }

    const updated = await prisma.community.update({
      where: { id },
      data: {
        name: name || community.name,
        description: description !== undefined ? description : community.description,
        iconDataUrl: iconDataUrl !== undefined ? iconDataUrl : community.iconDataUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating community:", error);
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

    if (community.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can delete this community" }, { status: 403 });
    }

    await prisma.community.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}