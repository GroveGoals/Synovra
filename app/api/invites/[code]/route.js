import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invite = await prisma.invite.findUnique({ where: { code: params.code } });
    if (!invite) return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });

    const community = await prisma.community.findUnique({ where: { id: invite.communityId } });
    if (!community) return NextResponse.json({ error: "This community no longer exists." }, { status: 404 });

    const expired = invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false;
    const maxedOut = invite.maxUses ? invite.useCount >= invite.maxUses : false;

    return NextResponse.json({
      valid: !expired && !maxedOut,
      reason: expired ? "expired" : maxedOut ? "maxed_out" : null,
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        iconDataUrl: community.iconDataUrl,
        bannerDataUrl: community.bannerDataUrl,
        memberCount: community.memberIds.length,
        isMember: community.memberIds.includes(userId),
      },
    });
  } catch (err) {
    console.error("GET /api/invites/[code] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}