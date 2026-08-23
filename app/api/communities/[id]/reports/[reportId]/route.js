import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

const VALID_STATUSES = ["open", "reviewing", "resolved"];

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to update reports." }, { status: 403 });
    }

    const existing = await prisma.report.findUnique({ where: { id: params.reportId } });
    if (!existing || existing.communityId !== params.id) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const body = await request.json();
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: params.reportId },
      data: { status: body.status },
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error("PATCH /api/communities/[id]/reports/[reportId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}
