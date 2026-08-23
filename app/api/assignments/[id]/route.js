import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

async function loadOwned(id, userId) {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.userId !== userId) return null;
  return assignment;
}

export async function PATCH(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const data = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.subject !== undefined) data.subject = body.subject?.trim() || null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.completed !== undefined) data.completed = !!body.completed;

  const assignment = await prisma.assignment.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, assignment });
}

export async function DELETE(req, { params }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.assignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}