import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const saves = await prisma.feedSave.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { post: { select: { id: true, mediaUrl: true, mediaType: true } } },
  });

  return NextResponse.json({ posts: saves.map((s) => s.post) });
}