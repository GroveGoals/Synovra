import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isCommunityAdmin(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isCommunityAdmin(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to revoke invites." }, { status: 403 });
    }

    const invite = await prisma.invite.findUnique({ where: { id: params.inviteId } });
    if (!invite || invite.communityId !== params.id) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    await prisma.invite.delete({ where: { id: params.inviteId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/invites/[inviteId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}