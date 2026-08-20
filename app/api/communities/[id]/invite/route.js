import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  const requesterId = getSessionUserId();
  if (!requesterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (community.ownerId !== requesterId) {
      return NextResponse.json({ error: "Only the owner can invite members." }, { status: 403 });
    }

    const body = await request.json();
    const username = (body.username || "").trim();
    if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return NextResponse.json({ error: "No user found with that username." }, { status: 404 });
    if (community.memberIds.includes(targetUser.id)) {
      return NextResponse.json({ error: "That user is already a member." }, { status: 409 });
    }

    await prisma.community.update({
      where: { id: params.id },
      data: { memberIds: { push: targetUser.id } },
    });

    return NextResponse.json({ ok: true, username: targetUser.username });
  } catch (err) {
    console.error("POST /api/communities/[id]/invite error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}