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
      return NextResponse.json({ error: "You don't have permission to edit rules." }, { status: 403 });
    }

    const body = await request.json();
    const data = {};
    if (typeof body.text === "string" && body.text.trim()) data.text = body.text.trim();
    if (typeof body.order === "number") data.order = body.order;

    const rule = await prisma.rule.update({
      where: { id: params.ruleId },
      data,
    });

    return NextResponse.json({ rule });
  } catch (err) {
    console.error("PATCH /api/communities/[id]/rules/[ruleId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to delete rules." }, { status: 403 });
    }

    await prisma.rule.delete({ where: { id: params.ruleId } });

    await prisma.community.update({
      where: { id: params.id },
      data: { rulesAcknowledgedBy: [] },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/rules/[ruleId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}