// lib/channelPermissions.js
import { hasPermission } from "@/lib/permissions";

// Can this user view/post in a channel at all?
export function canAccessChannel(channel, community, roles, userId) {
  if (community.ownerId === userId || community.adminIds.includes(userId)) return true;
  if (channel.visibility !== "restricted") return true;

  const myRoleIds = roles.filter((r) => r.memberIds.includes(userId)).map((r) => r.id);
  return channel.allowedRoleIds.some((id) => myRoleIds.includes(id));
}

// Can this user manage (create/edit/delete) channels in this community?
export function canManageChannels(community, roles, userId) {
  if (community.ownerId === userId || community.adminIds.includes(userId)) return true;
  return hasPermission(community, roles, userId, "manage_channels");
}