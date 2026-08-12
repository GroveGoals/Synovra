import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const favoriteOnly = searchParams.get("favorite") === "true";
  const collectionId = searchParams.get("collectionId");

  const items = await prisma.toolRun.findMany({
    where: {
      userId: user.id,
      ...(favoriteOnly ? { favorited: true } : {}),
      ...(collectionId ? { collectionId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { toolId, toolLabel, inputSummary, result } = await req.json();
  if (!toolId || !result) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const item = await prisma.toolRun.create({
    data: {
      userId: user.id,
      toolId,
      toolLabel: toolLabel || toolId,
      inputSummary: inputSummary || "",
      result,
    },
  });

  return NextResponse.json({ ok: true, item });
}