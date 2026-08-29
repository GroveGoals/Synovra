import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET(req, { params }) {
  const viewer = await requireUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "posts"; // posts | private | favorites | liked

  const profileUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, username: true, avatarDataUrl: true, bio: true, online: true, createdAt: true },
  });
  if (!profileUser) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isOwner = viewer.id === profileUser.id;

  const [followerCount, followingCount, isFollowing, allTheirPosts] = await Promise.all([
    prisma.follow.count({ where: { followingId: profileUser.id } }),
    prisma.follow.count({ where: { followerId: profileUser.id } }),
    isOwner ? Promise.resolve(false) : prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: profileUser.id } },
    }),
    prisma.feedPost.findMany({ where: { authorId: profileUser.id }, select: { likedBy: true } }),
  ]);

  const likeCount = allTheirPosts.reduce((sum, p) => sum + p.likedBy.length, 0);

  let posts = [];
  if (tab === "posts") {
    posts = await prisma.feedPost.findMany({
      where: { authorId: profileUser.id, isPrivate: false },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
    });
  } else if (tab === "private" && isOwner) {
    posts = await prisma.feedPost.findMany({
      where: { authorId: profileUser.id, isPrivate: true },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
    });
  } else if (tab === "favorites" && isOwner) {
    const saves = await prisma.feedSave.findMany({
      where: { userId: profileUser.id },
      orderBy: { createdAt: "desc" },
      include: { post: { include: { author: { select: { id: true, username: true, avatarDataUrl: true } } } } },
    });
    posts = saves.map((s) => s.post);
  } else if (tab === "liked" && isOwner) {
    posts = await prisma.feedPost.findMany({
      where: { likedBy: { has: profileUser.id } },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
    });
  }

  return NextResponse.json({
    user: profileUser,
    isOwner,
    isFollowing: !!isFollowing,
    stats: { followerCount, followingCount, likeCount },
    posts: posts.map((p) => ({
      id: p.id, caption: p.caption, mediaUrl: p.mediaUrl, mediaType: p.mediaType,
      isPrivate: p.isPrivate, createdAt: p.createdAt, author: p.author,
    })),
  });
}