import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { notify } from "@/lib/notify";
import { canCreateThreadsInChannel } from "@/lib/channelAccess";

export async function POST(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (post.channelId) {
    const channel = await prisma.channel.findUnique({ where: { id: post.channelId } });
    if (channel) {
      const community = await prisma.community.findUnique({ where: { id: post.communityId } });
      if (community) {
        const roles = await prisma.role.findMany({ where: { communityId: community.id } });
        const allowed = canCreateThreadsInChannel(channel, community, roles, user.id);
        if (!allowed) {
          return NextResponse.json({ error: "You don't have permission to reply in threads here." }, { status: 403 });
        }
      }
    }
  }

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