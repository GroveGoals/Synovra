import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageChannels } from "@/lib/channelPermissions";

const VALID_TYPES = ["text", "announcement", "media"];

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const channels = await prisma.channel.findMany({
      where: { communityId: params.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ channels });
  } catch (err) {
    console.error("GET /api/communities/[id]/channels error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const roles = await prisma.role.findMany({ where: { communityId: params.id } });
    if (!canManageChannels(community, roles, userId)) {
      return NextResponse.json({ error: "You don't have permission to add channels." }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || "").trim().toLowerCase().replace(/\s+/g, "-");
    const sectionId = body.sectionId || null;
    const type = VALID_TYPES.includes(body.type) ? body.type : "text";
    if (!name) return NextResponse.json({ error: "Channel name is required." }, { status: 400 });

    const count = await prisma.channel.count({ where: { communityId: params.id } });

    const channel = await prisma.channel.create({
      data: {
        communityId: params.id,
        name,
        sectionId,
        type,
        order: count,
        visibility: body.visibility === "restricted" ? "restricted" : "public",
        allowedRoleIds: Array.isArray(body.allowedRoleIds) ? body.allowedRoleIds : [],
        canSendMessages: body.canSendMessages !== false,
        canSendImages: body.canSendImages !== false,
        canUseThreads: body.canUseThreads !== false,
        emojiMode: ["all", "restricted_set", "none"].includes(body.emojiMode) ? body.emojiMode : "all",
        allowedEmojis: Array.isArray(body.allowedEmojis) ? body.allowedEmojis : [],
      },
    });

    return NextResponse.json({ channel });
  } catch (err) {
    console.error("POST /api/communities/[id]/channels error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}