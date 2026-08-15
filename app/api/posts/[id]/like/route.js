import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { notify } from "@/lib/notify";

export async function POST(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const alreadyLiked = post.likedBy.includes(user.id);
  const nextLikedBy = alreadyLiked
    ? post.likedBy.filter((id) => id !== user.id)
    : [...post.likedBy, user.id];

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: { likedBy: nextLikedBy },
  });

  if (!alreadyLiked && post.authorId !== user.id) {
    await notify(post.authorId, {
      category: "community",
      title: "New like",
      description: `${user.username} liked your post.`,
    });
  }

  return NextResponse.json({ ok: true, likeCount: updated.likedBy.length, likedByMe: !alreadyLiked });
}