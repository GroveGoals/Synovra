import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to edit this community." }, { status: 403 });
    }

    const body = await request.json();
    const data = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim() || null;
    }
    if (typeof body.bannerDataUrl === "string") {
      data.bannerDataUrl = body.bannerDataUrl || null;
    }
    if (typeof body.iconDataUrl === "string") {
      data.iconDataUrl = body.iconDataUrl || null;
    }

    if (Array.isArray(body.adminIds) && community.ownerId === userId) {
      data.adminIds = body.adminIds.filter((id) => typeof id === "string");
    }

    const updated = await prisma.community.update({ where: { id: params.id }, data });

    return NextResponse.json({
      community: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        iconDataUrl: updated.iconDataUrl,
        bannerDataUrl: updated.bannerDataUrl,
        adminIds: updated.adminIds,
      },
    });
  } catch (err) {
    console.error("PATCH /api/communities/[id]/settings error:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A community with that name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}