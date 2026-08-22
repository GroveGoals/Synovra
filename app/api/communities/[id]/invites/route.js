import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const existing = await prisma.invite.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique invite code.");
}

function isCommunityAdmin(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isCommunityAdmin(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to view invites." }, { status: 403 });
    }

    const invites = await prisma.invite.findMany({
      where: { communityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (err) {
    console.error("GET /api/communities/[id]/invites error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isCommunityAdmin(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to create invites." }, { status: 403 });
    }

    const body = await request.json();
    const maxUses = body.maxUses ? parseInt(body.maxUses, 10) : null;
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return NextResponse.json({ error: "maxUses must be a positive integer." }, { status: 400 });
    }

    let expiresAt = null;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        return NextResponse.json({ error: "Invalid expiresAt date." }, { status: 400 });
      }
    }

    const code = await generateUniqueCode();

    const invite = await prisma.invite.create({
      data: { communityId: params.id, code, createdBy: userId, maxUses, expiresAt },
    });

    return NextResponse.json({ invite });
  } catch (err) {
    console.error("POST /api/communities/[id]/invites error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}