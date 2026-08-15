import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { notify } from "@/lib/notify";

export async function GET(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const communities = await prisma.community.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
  });

  const shaped = communities.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    iconDataUrl: c.iconDataUrl,
    ownerId: c.ownerId,
    memberCount: c.memberIds.length,
    isMember: c.memberIds.includes(user.id),
    isOwner: c.ownerId === user.id,
  }));

  return NextResponse.json({ communities: shaped });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { name, description } = await req.json();
  const cleanName = (name || "").trim();
  if (cleanName.length < 3) {
    return NextResponse.json({ error: "Community name must be at least 3 characters." }, { status: 400 });
  }

  const existing = await prisma.community.findUnique({ where: { name: cleanName } });
  if (existing) {
    return NextResponse.json({ error: "That community name is already taken." }, { status: 409 });
  }

  const community = await prisma.community.create({
    data: {
      name: cleanName,
      description: (description || "").trim() || null,
      ownerId: user.id,
      memberIds: [user.id],
    },
  });

  await notify(user.id, {
    category: "community",
    title: "Community created",
    description: `You created "${community.name}".`,
  });

  return NextResponse.json({ ok: true, community });
}