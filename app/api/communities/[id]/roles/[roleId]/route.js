import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS, canManageRole } from "@/lib/permissions";

export async function PATCH(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = await prisma.role.findUnique({ where: { id: params.roleId } });
    if (!role || role.communityId !== params.id) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    const allRoles = await prisma.role.findMany({ where: { communityId: params.id } });
    if (!canManageRole(community, allRoles, userId, role)) {
      return NextResponse.json({ error: "You don't have permission to edit this role." }, { status: 403 });
    }

    const body = await request.json();
    const data = {};

    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.color === "string") data.color = body.color || null;
    if (Array.isArray(body.memberIds)) data.memberIds = body.memberIds;
    if (Array.isArray(body.permissions)) {
      data.permissions = body.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
    }

    const updated = await prisma.role.update({
      where: { id: params.roleId },
      data,
    });

    return NextResponse.json({ role: updated });
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

    const role = await prisma.role.findUnique({ where: { id: params.roleId } });
    if (!role || role.communityId !== params.id) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    const allRoles = await prisma.role.findMany({ where: { communityId: params.id } });
    if (!canManageRole(community, allRoles, userId, role)) {
      return NextResponse.json({ error: "You don't have permission to delete this role." }, { status: 403 });
    }

    await prisma.role.delete({ where: { id: params.roleId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]/roles/[roleId] error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}