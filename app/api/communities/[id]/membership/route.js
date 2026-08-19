import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { id: params.id } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!community.memberIds.includes(userId)) {
    await prisma.community.update({
      where: { id: params.id },
      data: { memberIds: { push: userId } },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { id: params.id } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.ownerId === userId) {
    return NextResponse.json({ error: "Owner can't leave their own community." }, { status: 400 });
  }

  await prisma.community.update({
    where: { id: params.id },
    data: { memberIds: community.memberIds.filter((id) => id !== userId) },
  });
  return NextResponse.json({ ok: true });
}