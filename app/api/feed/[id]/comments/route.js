import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const comments = await prisma.feedComment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
  });

  return NextResponse.json({ comments });
}

export async function POST(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
  }

  const post = await prisma.feedPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const comment = await prisma.feedComment.create({
    data: { postId: params.id, authorId: user.id, content: content.trim() },
    include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
  });

  return NextResponse.json({ ok: true, comment });
}
