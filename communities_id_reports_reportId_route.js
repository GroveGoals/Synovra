import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

const VALID_TARGET_TYPES = ["post", "comment", "member"];

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to view reports." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const where = { communityId: params.id };
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const reporterIds = [...new Set(reports.map((r) => r.reporterId))];
    const reporters = await prisma.user.findMany({
      where: { id: { in: reporterIds } },
      select: { id: true, username: true, avatarDataUrl: true },
    });
    const reporterMap = Object.fromEntries(reporters.map((u) => [u.id, u]));

    const formatted = reports.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reporter: reporterMap[r.reporterId] || null,
    }));

    return NextResponse.json({ reports: formatted });
  } catch (err) {
    console.error("GET /api/communities/[id]/reports error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!community.memberIds.includes(userId)) {
      return NextResponse.json({ error: "You must be a member to report content." }, { status: 403 });
    }

    const body = await request.json();
    const targetType = body.targetType;
    const targetId = (body.targetId || "").trim();
    const reason = (body.reason || "").trim();

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return NextResponse.json({ error: "Invalid report target type." }, { status: 400 });
    }
    if (!targetId) {
      return NextResponse.json({ error: "Missing target." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Please describe why you're reporting this." }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        communityId: params.id,
        reporterId: userId,
        targetType,
        targetId,
        reason,
      },
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error("POST /api/communities/[id]/reports error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}
