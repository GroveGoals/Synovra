import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const community = await prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const posts = await prisma.post.findMany({
      where: { communityId: id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarDataUrl: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarDataUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const postsWithLiked = posts.map(post => ({
      ...post,
      isLiked: post.likedBy.includes(userId),
      commentCount: post.comments.length,
    }));

    return NextResponse.json({ posts: postsWithLiked });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (!community.memberIds.includes(userId)) {
      return NextResponse.json({ error: "You must be a member to post" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        communityId: id,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarDataUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}