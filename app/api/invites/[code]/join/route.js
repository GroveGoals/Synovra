import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invite = await prisma.invite.findUnique({ where: { code: params.code } });
    if (!invite) return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });

    const expired = invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false;
    const maxedOut = invite.maxUses ? invite.useCount >= invite.maxUses : false;
    if (expired) return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
    if (maxedOut) return NextResponse.json({ error: "This invite link has reached its use limit." }, { status: 410 });

    const community = await prisma.community.findUnique({ where: { id: invite.communityId } });
    if (!community) return NextResponse.json({ error: "This community no longer exists." }, { status: 404 });

    if (!community.memberIds.includes(userId)) {
      await prisma.community.update({
        where: { id: community.id },
        data: { memberIds: { push: userId } },
      });
      await prisma.invite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      });

      if (community.welcomeMessage) {
        await prisma.notification.create({
          data: {
            userId,
            category: "community",
            title: `Welcome to ${community.name}`,
            description: community.welcomeMessage,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, communityId: community.id });
  } catch (err) {
    console.error("POST /api/invites/[code]/join error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}