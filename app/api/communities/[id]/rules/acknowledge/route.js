import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!community.memberIds.includes(userId)) {
      return NextResponse.json({ error: "You must be a member to acknowledge rules." }, { status: 403 });
    }

    if (!community.rulesAcknowledgedBy.includes(userId)) {
      await prisma.community.update({
        where: { id: params.id },
        data: { rulesAcknowledgedBy: [...community.rulesAcknowledgedBy, userId] },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/communities/[id]/rules/acknowledge error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}