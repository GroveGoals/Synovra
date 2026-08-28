// lib/permissions.js
// Canonical permission list (matches section 9 of the Vreedits spec) + resolution engine.

export const COMMUNITY_PERMISSIONS = [
  "manage_community", "manage_channels", "manage_roles", "manage_members",
  "manage_events", "manage_invites", "manage_messages", "manage_moderation",
  "view_analytics", "manage_settings",
];

export const MEMBER_PERMISSIONS = [
  "view_channels", "send_messages", "send_media", "react",
  "create_posts", "create_threads", "join_voice", "create_events", "invite_members",
];

export const MODERATION_PERMISSIONS = [
  "delete_messages", "timeout_members", "remove_members", "ban_members",
  "manage_reports", "manage_moderation_logs",
];

export const ALL_PERMISSIONS = [
  ...COMMUNITY_PERMISSIONS,
  ...MEMBER_PERMISSIONS,
  ...MODERATION_PERMISSIONS,
];

// Default permission set every plain member gets, even with no roles assigned.
const DEFAULT_MEMBER_PERMISSIONS = [
  "view_channels", "send_messages", "send_media", "react",
  "create_posts", "create_threads", "join_voice",
];

// Returns the full set of permissions a user has in a community.
// roles = the community's full Role[] list (already fetched by the caller).
export function resolveUserPermissions(community, roles, userId) {
  if (community.ownerId === userId) return new Set(ALL_PERMISSIONS);

  const permissionSet = new Set(DEFAULT_MEMBER_PERMISSIONS);

  if (community.adminIds.includes(userId)) {
    ALL_PERMISSIONS.forEach((p) => permissionSet.add(p));
    return permissionSet;
  }

  const myRoles = roles.filter((r) => r.memberIds.includes(userId));
  for (const role of myRoles) {
    role.permissions.forEach((p) => permissionSet.add(p));
  }

  return permissionSet;
}

export function hasPermission(community, roles, userId, permission) {
  return resolveUserPermissions(community, roles, userId).has(permission);
}

// Returns the highest role position a user holds (owner/admin treated as infinite).
export function getUserHighestPosition(community, roles, userId) {
  if (community.ownerId === userId) return Infinity;
  if (community.adminIds.includes(userId)) return Infinity - 1;

  const myRoles = roles.filter((r) => r.memberIds.includes(userId));
  if (myRoles.length === 0) return -1;
  return Math.max(...myRoles.map((r) => r.position));
}

// Hierarchy check: can actingUserId manage/moderate targetUserId?
// A user can only act on someone with a strictly lower highest-role position.
// The owner is always protected (nobody can act on the owner except themselves).
export function canManageUser(community, roles, actingUserId, targetUserId) {
  if (targetUserId === community.ownerId) return actingUserId === community.ownerId;
  if (actingUserId === targetUserId) return false; // no self-moderation via this check

  const actingPos = getUserHighestPosition(community, roles, actingUserId);
  const targetPos = getUserHighestPosition(community, roles, targetUserId);
  return actingPos > targetPos;
}

// Hierarchy check for role management: can actingUserId edit/delete/assign this role?
export function canManageRole(community, roles, actingUserId, role) {
  if (community.ownerId === actingUserId) return true;
  const actingPos = getUserHighestPosition(community, roles, actingUserId);
  return actingPos > role.position;
}