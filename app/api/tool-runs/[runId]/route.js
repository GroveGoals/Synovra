import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const run = await prisma.toolRun.findUnique({ where: { id: params.runId } });
  if (!run || run.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, run });
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const run = await prisma.toolRun.findUnique({ where: { id: params.runId } });
  if (!run || run.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { favorited } = await req.json();
  const updated = await prisma.toolRun.update({
    where: { id: params.runId },
    data: { favorited: !!favorited },
  });

  return NextResponse.json({ ok: true, run: updated });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const run = await prisma.toolRun.findUnique({ where: { id: params.runId } });
  if (!run || run.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.toolRun.delete({ where: { id: params.runId } });
  return NextResponse.json({ ok: true });
}
