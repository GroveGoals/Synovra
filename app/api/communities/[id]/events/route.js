import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const hostSelect = { id: true, username: true, avatarDataUrl: true };

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const events = await prisma.event.findMany({
      where: { communityId: params.id },
      orderBy: { startTime: "asc" },
      include: { host: { select: hostSelect } },
    });

    const formatted = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startTime: e.startTime,
      host: e.host,
      attendeeCount: e.attendeeIds.length,
      isAttending: e.attendeeIds.includes(userId),
    }));

    return NextResponse.json({ events: formatted });
  } catch (err) {
    console.error("GET /api/communities/[id]/events error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!community.memberIds.includes(userId)) {
      return NextResponse.json({ error: "You must join this community to create events." }, { status: 403 });
    }

    const body = await request.json();
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    const startTime = body.startTime ? new Date(body.startTime) : null;
    if (!title) return NextResponse.json({ error: "Event title is required." }, { status: 400 });
    if (!startTime || isNaN(startTime.getTime())) return NextResponse.json({ error: "Valid start time is required." }, { status: 400 });

    const event = await prisma.event.create({
      data: {
        communityId: params.id,
        title,
        description: description || null,
        startTime,
        hostId: userId,
        attendeeIds: [userId],
      },
      include: { host: { select: hostSelect } },
    });

    return NextResponse.json({
      event: {
        id: event.id, title: event.title, description: event.description, startTime: event.startTime,
        host: event.host, attendeeCount: 1, isAttending: true,
      },
    });
  } catch (err) {
    console.error("POST /api/communities/[id]/events error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}