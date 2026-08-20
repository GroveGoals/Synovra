import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const authorSelect = { id: true, username: true, avatarDataUrl: true };

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  try {
    const where = { communityId: params.id };
    if (channelId) where.channelId = channelId;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: authorSelect },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: authorSelect } },
        },
      },
    });

    const formatted = posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      channelId: p.channelId,
      author: p.author,
      likeCount: p.likedBy.length,
      likedByMe: p.likedBy.includes(userId),
      comments: p.comments,
    }));

    return NextResponse.json({ posts: formatted });
  } catch (err) {
    console.error("GET /api/communities/[id]/posts error:", err);
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
      return NextResponse.json({ error: "You must join this community to post." }, { status: 403 });
    }

    const body = await request.json();
    const content = (body.content || "").trim();
    const channelId = body.channelId || null;
    if (!content) return NextResponse.json({ error: "Post content is required." }, { status: 400 });

    const post = await prisma.post.create({
      data: { communityId: params.id, channelId, authorId: userId, content },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({
      post: { id: post.id, content: post.content, createdAt: post.createdAt, channelId: post.channelId, author: post.author, likeCount: 0, likedByMe: false, comments: [] },
    });
  } catch (err) {
    console.error("POST /api/communities/[id]/posts error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}