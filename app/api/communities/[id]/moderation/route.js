import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManage(community, userId) {
  return community.ownerId === userId || community.adminIds.includes(userId);
}

const VALID_ACTIONS = ["warn", "remove_message", "restrict", "remove", "ban"];
const authorSelect = { id: true, username: true, avatarDataUrl: true };

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to view the audit log." }, { status: 403 });
    }

    const actions = await prisma.moderationAction.findMany({
      where: { communityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    const userIds = [...new Set(actions.flatMap((a) => [a.moderatorId, a.targetUserId]))];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: authorSelect });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const formatted = actions.map((a) => ({
      id: a.id,
      action: a.action,
      reason: a.reason,
      createdAt: a.createdAt,
      moderator: userMap[a.moderatorId] || null,
      targetUser: userMap[a.targetUserId] || null,
    }));

    return NextResponse.json({ actions: formatted });
  } catch (err) {
    console.error("GET /api/communities/[id]/moderation error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManage(community, userId)) {
      return NextResponse.json({ error: "You don't have permission to take moderation actions." }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action;
    const reason = (body.reason || "").trim();
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "A reason is required." }, { status: 400 });
    }

    let targetUserId = body.targetUserId || null;
    let targetPostId = body.targetPostId || null;
    let report = null;

    if (body.reportId) {
      report = await prisma.report.findUnique({ where: { id: body.reportId } });
      if (!report || report.communityId !== params.id) {
        return NextResponse.json({ error: "Report not found." }, { status: 404 });
      }

      if (report.targetType === "member") {
        targetUserId = report.targetId;
      } else if (report.targetType === "post") {
        const post = await prisma.post.findUnique({ where: { id: report.targetId } });
        if (!post) return NextResponse.json({ error: "Reported post no longer exists." }, { status: 404 });
        targetUserId = post.authorId;
        targetPostId = post.id;
      } else if (report.targetType === "comment") {
        const comment = await prisma.comment.findUnique({ where: { id: report.targetId } });
        if (!comment) return NextResponse.json({ error: "Reported comment no longer exists." }, { status: 404 });
        targetUserId = comment.authorId;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "No target user could be determined for this action." }, { status: 400 });
    }

    if (action === "remove_message") {
      if (targetPostId) {
        await prisma.post.delete({ where: { id: targetPostId } }).catch(() => {});
      } else if (report?.targetType === "comment") {
        await prisma.comment.delete({ where: { id: report.targetId } }).catch(() => {});
      } else {
        return NextResponse.json({ error: "No message specified to remove." }, { status: 400 });
      }
    }

    if (action === "remove" || action === "ban") {
      await prisma.community.update({
        where: { id: params.id },
        data: { memberIds: community.memberIds.filter((id) => id !== targetUserId) },
      });
    }

    const modAction = await prisma.moderationAction.create({
      data: {
        communityId: params.id,
        moderatorId: userId,
        targetUserId,
        action,
        reason,
      },
    });

    if (report) {
      await prisma.report.update({ where: { id: report.id }, data: { status: "resolved" } });
    }

    return NextResponse.json({ action: modAction });
  } catch (err) {
    console.error("POST /api/communities/[id]/moderation error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}