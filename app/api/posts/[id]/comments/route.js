import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { notify } from "@/lib/notify";

export async function POST(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { content } = await req.json();
  const cleanContent = (content || "").trim();
  if (!cleanContent) return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { postId: params.id, authorId: user.id, content: cleanContent },
    include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
  });

  if (post.authorId !== user.id) {
    await notify(post.authorId, {
      category: "community",
      title: "New comment",
      description: `${user.username} commented on your post.`,
    });
  }

  return NextResponse.json({ ok: true, comment });
}