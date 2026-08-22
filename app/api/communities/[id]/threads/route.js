import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const authorSelect = { id: true, username: true, avatarDataUrl: true };

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const posts = await prisma.post.findMany({
      where: {
        communityId: params.id,
        comments: { some: {} },
      },
      include: {
        author: { select: authorSelect },
        channel: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const threads = posts.map((p) => ({
      postId: p.id,
      channelId: p.channelId,
      channelName: p.channel?.name || null,
      title: p.title || null,
      preview: p.content,
      author: p.author,
      replyCount: p._count.comments,
    }));

    return NextResponse.json({ threads });
  } catch (err) {
    console.error("GET /api/communities/[id]/threads error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}