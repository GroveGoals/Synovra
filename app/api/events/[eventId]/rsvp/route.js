import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const attending = event.attendeeIds.includes(userId);
    const attendeeIds = attending
      ? event.attendeeIds.filter((id) => id !== userId)
      : [...event.attendeeIds, userId];

    await prisma.event.update({ where: { id: params.eventId }, data: { attendeeIds } });
    return NextResponse.json({ ok: true, isAttending: !attending, attendeeCount: attendeeIds.length });
  } catch (err) {
    console.error("POST /api/events/[eventId]/rsvp error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}