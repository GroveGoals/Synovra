import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const assignments = await prisma.assignment.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });

  return NextResponse.json({ assignments });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { title, subject, dueDate, notes } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      userId: user.id,
      title: title.trim(),
      subject: subject?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, assignment });
}