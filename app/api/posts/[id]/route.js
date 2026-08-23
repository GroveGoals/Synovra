import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (post.authorId !== userId) {
      return NextResponse.json({ error: "You can only edit your own posts." }, { status: 403 });
    }

    const body = await request.json();
    const data = {};
    if (typeof body.content === "string") {
      const content = body.content.trim();
      if (!content) return NextResponse.json({ error: "Content can't be empty." }, { status: 400 });
      data.content = content;
    }
    if (typeof body.title === "string") {
      data.title = body.title.trim() || null;
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data,
      include: { author: { select: { id: true, username: true, avatarDataUrl: true } } },
    });

    return NextResponse.json({ post: updated });
  } catch (err) {
    console.error("PATCH /api/posts/[id] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (post.authorId !== userId) {
      return NextResponse.json({ error: "You can only delete your own posts." }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/posts/[id] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}