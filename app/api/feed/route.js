import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const posts = await prisma.feedPost.findMany({
    take: 10,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, avatarDataUrl: true } },
      _count: { select: { comments: true } },
      saves: { where: { userId: user.id }, select: { id: true } },
    },
  });

  const shaped = posts.map((p) => ({
    id: p.id,
    caption: p.caption,
    mediaUrl: p.mediaUrl,
    mediaType: p.mediaType,
    createdAt: p.createdAt,
    author: p.author,
    likeCount: p.likedBy.length,
    likedByMe: p.likedBy.includes(user.id),
    commentCount: p._count.comments,
    savedByMe: p.saves.length > 0,
  }));

  return NextResponse.json({
    posts: shaped,
    nextCursor: posts.length === 10 ? posts[posts.length - 1].id : null,
  });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { caption, mediaUrl, mediaType } = await req.json();
  if (!caption?.trim() && !mediaUrl) {
    return NextResponse.json({ error: "Add a caption or an image first." }, { status: 400 });
  }

  const post = await prisma.feedPost.create({
    data: {
      authorId: user.id,
      caption: caption?.trim() || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType === "video" ? "video" : "image",
    },
    include: {
      author: { select: { id: true, username: true, avatarDataUrl: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    post: {
      id: post.id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      createdAt: post.createdAt,
      author: post.author,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
      savedByMe: false,
    },
  });
    }
