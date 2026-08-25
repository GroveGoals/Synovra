import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json({ ok: true, folders });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  const folder = await prisma.folder.create({
    data: { userId: user.id, name: name.trim() },
  });

  return NextResponse.json({ ok: true, folder });
}