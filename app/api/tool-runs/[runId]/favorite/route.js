// app/api/tool-runs/[runId]/favorite/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await prisma.toolRun.findUnique({ where: { id: params.runId } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const updated = await prisma.toolRun.update({
    where: { id: params.runId },
    data: { favorited: !existing.favorited },
  });

  return NextResponse.json({ run: updated });
}