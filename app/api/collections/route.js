import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { toolRuns: true } } },
  });

  return NextResponse.json({ collections });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { name } = await req.json();
  const cleanName = (name || "").trim();
  if (!cleanName) return NextResponse.json({ error: "Collection name is required." }, { status: 400 });

  const collection = await prisma.collection.create({
    data: { userId: user.id, name: cleanName },
    include: { _count: { select: { toolRuns: true } } },
  });

  return NextResponse.json({ ok: true, collection });
}