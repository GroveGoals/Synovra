import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (community.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can edit roles." }, { status: 403 });
    }

    const body = await request.json();
    const data = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.color === "string") data.color = body.color || null;
    if (Array.isArray(body.permissions)) data.permissions = body.permissions.filter((p) => typeof p === "string");
    if (Array.isArray(body.memberIds)) data.memberIds = body.memberIds.filter((id) => typeof id === "string");

    const role = await prisma.role.update({ where: { id: params.roleId }, data });
    return NextResponse.json({ role });
  } catch (err) {
    console.error("PATCH /api/communities/[id]/roles/[roleId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (community.ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can delete roles." }, { status: 403 });
    }

    await prisma.role.delete({ where: { id: params.roleId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/roles/[roleId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}