import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const authorSelect = { id: true, username: true, avatarDataUrl: true };

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const posts = await prisma.post.findMany({
      where: { communityId: params.id, comments: { some: {} } },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: authorSelect },
        channel: { select: { id: true, name: true, type: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { author: { select: authorSelect } },
        },
        _count: { select: { comments: true } },
      },
    });

    const threads = posts.map((p) => ({
      postId: p.id,
      channelId: p.channelId,
      channelName: p.channel?.name || null,
      channelType: p.channel?.type || null,
      title: p.title,
      preview: p.content,
      author: p.author,
      replyCount: p._count.comments,
      lastReply: p.comments[0] || null,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ threads });
  } catch (err) {
    console.error("GET /api/communities/[id]/threads error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}