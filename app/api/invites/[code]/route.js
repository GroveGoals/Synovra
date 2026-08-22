import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function inviteStatus(invite) {
  if (invite.disabled) return "revoked";
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return "expired";
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) return "exhausted";
  return "valid";
}

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invite = await prisma.invite.findUnique({ where: { code: params.code } });
    if (!invite) return NextResponse.json({ error: "Invite not found." }, { status: 404 });

    const community = await prisma.community.findUnique({ where: { id: invite.communityId } });
    if (!community) return NextResponse.json({ error: "Invite not found." }, { status: 404 });

    return NextResponse.json({
      status: inviteStatus(invite),
      community: {
        id: community.id, name: community.name, description: community.description,
        iconDataUrl: community.iconDataUrl, bannerDataUrl: community.bannerDataUrl,
        memberCount: community.memberIds.length,
      },
      alreadyMember: community.memberIds.includes(userId),
    });
  } catch (err) {
    console.error("GET /api/invites/[code] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invite = await prisma.invite.findUnique({ where: { code: params.code } });
    if (!invite) return NextResponse.json({ error: "Invite not found." }, { status: 404 });

    const status = inviteStatus(invite);
    if (status !== "valid") {
      return NextResponse.json({ error: `This invite is ${status}.` }, { status: 410 });
    }

    const community = await prisma.community.findUnique({ where: { id: invite.communityId } });
    if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });

    if (community.memberIds.includes(userId)) {
      return NextResponse.json({ community: { id: community.id, slug: community.slug }, alreadyMember: true });
    }

    await prisma.$transaction([
      prisma.community.update({ where: { id: community.id }, data: { memberIds: { push: userId } } }),
      prisma.invite.update({ where: { id: invite.id }, data: { useCount: { increment: 1 } } }),
    ]);

    return NextResponse.json({ community: { id: community.id, slug: community.slug }, alreadyMember: false });
  } catch (err) {
    console.error("POST /api/invites/[code] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}