import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageChannels } from "@/lib/channelPermissions";

const VALID_TYPES = ["text", "announcement", "media"];

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const roles = await prisma.role.findMany({ where: { communityId: params.id } });
    if (!canManageChannels(community, roles, userId)) {
      return NextResponse.json({ error: "You don't have permission to edit channels." }, { status: 403 });
    }

    const body = await request.json();
    const data = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim().toLowerCase().replace(/\s+/g, "-");
    }
    if (typeof body.archived === "boolean") data.archived = body.archived;
    if (VALID_TYPES.includes(body.type)) data.type = body.type;
    if (body.visibility !== undefined) data.visibility = body.visibility === "restricted" ? "restricted" : "public";
    if (body.allowedRoleIds !== undefined) data.allowedRoleIds = Array.isArray(body.allowedRoleIds) ? body.allowedRoleIds : [];
    if (body.canSendMessages !== undefined) data.canSendMessages = !!body.canSendMessages;
    if (body.canSendImages !== undefined) data.canSendImages = !!body.canSendImages;
    if (body.canUseThreads !== undefined) data.canUseThreads = !!body.canUseThreads;
    if (body.emojiMode !== undefined && ["all", "restricted_set", "none"].includes(body.emojiMode)) data.emojiMode = body.emojiMode;
    if (body.allowedEmojis !== undefined) data.allowedEmojis = Array.isArray(body.allowedEmojis) ? body.allowedEmojis : [];

    const channel = await prisma.channel.update({
      where: { id: params.channelId },
      data,
    });

    return NextResponse.json({ channel });
  } catch (err) {
    console.error("PATCH /api/communities/[id]/channels/[channelId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const roles = await prisma.role.findMany({ where: { communityId: params.id } });
    if (!canManageChannels(community, roles, userId)) {
      return NextResponse.json({ error: "You don't have permission to delete channels." }, { status: 403 });
    }

    await prisma.channel.delete({ where: { id: params.channelId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/channels/[channelId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}