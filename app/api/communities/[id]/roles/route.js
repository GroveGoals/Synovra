import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const roles = await prisma.role.findMany({
      where: { communityId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ roles });
  } catch (err) {
    console.error("GET /api/communities/[id]/roles error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (community.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can create roles." }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || "").trim();
    const color = (body.color || "").trim() || null;
    const permissions = Array.isArray(body.permissions) ? body.permissions.filter((p) => typeof p === "string") : [];
    if (!name) return NextResponse.json({ error: "Role name is required." }, { status: 400 });

    const role = await prisma.role.create({
      data: { communityId: params.id, name, color, permissions },
    });

    return NextResponse.json({ role });
  } catch (err) {
    console.error("POST /api/communities/[id]/roles error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}