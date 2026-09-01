import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const bySubject = {};
  for (const s of sessions) {
    bySubject[s.subject] = (bySubject[s.subject] || 0) + s.minutes;
  }

  return NextResponse.json({ ok: true, sessions, totalMinutes, bySubject });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { subject, minutes, note } = await req.json().catch(() => ({}));
  const mins = Number(minutes);

  if (!subject?.trim()) {
    return NextResponse.json({ error: "Subject is required." }, { status: 400 });
  }
  if (!mins || mins <= 0 || mins > 600) {
    return NextResponse.json({ error: "Enter minutes between 1 and 600." }, { status: 400 });
  }

  const session = await prisma.studySession.create({
    data: { userId: user.id, subject: subject.trim(), minutes: mins, note: note?.trim() || null },
  });

  return NextResponse.json({ ok: true, session });
}