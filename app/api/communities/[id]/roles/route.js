import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS, hasPermission, getUserHighestPosition } from "@/lib/permissions";

export async function GET(request, { params }) {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const roles = await prisma.role.findMany({
      where: { communityId: params.id },
      orderBy: { position: "desc" },
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

    const existingRoles = await prisma.role.findMany({ where: { communityId: params.id } });
    const isOwner = community.ownerId === userId;
    const isAdmin = community.adminIds.includes(userId);
    const canCreate = isOwner || isAdmin || hasPermission(community, existingRoles, userId, "manage_roles");
    if (!canCreate) {
      return NextResponse.json({ error: "You don't have permission to create roles." }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Role name is required." }, { status: 400 });

    const requestedPermissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p) => ALL_PERMISSIONS.includes(p))
      : [];

    // A non-owner/admin creator can't grant a role permissions they don't themselves have.
    if (!isOwner && !isAdmin) {
      const actorPerms = new Set(existingRoles.filter((r) => r.memberIds.includes(userId)).flatMap((r) => r.permissions));
      const overReach = requestedPermissions.some((p) => !actorPerms.has(p));
      if (overReach) {
        return NextResponse.json({ error: "You can't grant permissions you don't have yourself." }, { status: 403 });
      }
    }

    const actingPos = getUserHighestPosition(community, existingRoles, userId);
    const maxExistingPos = existingRoles.length > 0 ? Math.max(...existingRoles.map((r) => r.position)) : 0;
    // New role is placed just below the creator's own position (or at 0 for owner/admin).
    const position = isOwner || isAdmin ? maxExistingPos + 1 : Math.max(0, Math.min(actingPos - 1, maxExistingPos));

    const role = await prisma.role.create({
      data: {
        communityId: params.id,
        name,
        color: body.color || null,
        position,
        permissions: requestedPermissions,
        memberIds: [],
      },
    });

    return NextResponse.json({ role });
  } catch (err) {
    console.error("POST /api/communities/[id]/roles error:", err);
    return NextResponse.json({ error: "Database error, please retry." }, { status: 500 });
  }
}