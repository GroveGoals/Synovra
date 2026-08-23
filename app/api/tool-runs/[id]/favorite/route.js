// app/api/tool-runs/[id]/favorite/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await prisma.toolRun.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const updated = await prisma.toolRun.update({
    where: { id: params.id },
    data: { favorited: !existing.favorited },
  });

  return NextResponse.json({ run: updated });
}