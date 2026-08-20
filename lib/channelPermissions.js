import { prisma } from "@/lib/prisma";

export async function getUserRoleIds(communityId, userId) {
  const roles = await prisma.role.findMany({
    where: { communityId, memberIds: { has: userId } },
    select: { id: true },
  });
  return roles.map((r) => r.id);
}

export async function canAccessChannel(channel, community, userId) {
  if (community.ownerId === userId || community.adminIds.includes(userId)) return true;
  if (channel.visibility !== "restricted") return true;
  const roleIds = await getUserRoleIds(community.id, userId);
  return channel.allowedRoleIds.some((id) => roleIds.includes(id));
}