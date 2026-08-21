// lib/channelAccess.js
// Granular per-channel access control: view / send / create_threads / manage,
// each targetable at Everyone, specific roles, specific members, Moderators,
// Administrators, or Owner only. Matches the Channel Permissions table design.

import { hasPermission } from "@/lib/permissions";

const DEFAULT_VIEW = { type: "everyone" };
const DEFAULT_SEND = { type: "everyone" };
const DEFAULT_THREADS = { type: "everyone" };
const DEFAULT_MANAGE = { type: "administrators" };

function getAccessConfig(channel, field, fallback) {
  if (channel[field] && typeof channel[field] === "object" && channel[field].type) {
    return channel[field];
  }
  // Backward compatibility with the old boolean-only channels from before this update.
  if (field === "viewAccess") {
    return channel.visibility === "restricted"
      ? { type: "roles", roleIds: channel.allowedRoleIds || [] }
      : DEFAULT_VIEW;
  }
  if (field === "sendAccess") {
    return channel.canSendMessages === false ? { type: "owner" } : DEFAULT_SEND;
  }
  if (field === "threadAccess") {
    return channel.canUseThreads === false ? { type: "owner" } : DEFAULT_THREADS;
  }
  return fallback;
}

// Is a user a "moderator" — holds any role with a moderation permission.
function isModerator(roles, userId) {
  return roles.some(
    (r) => r.memberIds.includes(userId) &&
      r.permissions.some((p) => p.startsWith("manage_") || p === "ban_members" || p === "timeout_members" || p === "remove_members")
  );
}

function checkAccess(config, community, roles, userId) {
  if (community.ownerId === userId) return true; // owner can always do everything

  switch (config.type) {
    case "everyone":
      return true;
    case "owner":
      return false; // already returned true above if actually owner
    case "administrators":
      return community.adminIds.includes(userId);
    case "moderators":
      return community.adminIds.includes(userId) || isModerator(roles, userId);
    case "roles": {
      const myRoleIds = roles.filter((r) => r.memberIds.includes(userId)).map((r) => r.id);
      return (config.roleIds || []).some((id) => myRoleIds.includes(id));
    }
    case "members":
      return (config.memberIds || []).includes(userId);
    default:
      return false;
  }
}

export function canViewChannel(channel, community, roles, userId) {
  return checkAccess(getAccessConfig(channel, "viewAccess", DEFAULT_VIEW), community, roles, userId);
}

export function canSendInChannel(channel, community, roles, userId) {
  if (!canViewChannel(channel, community, roles, userId)) return false;
  return checkAccess(getAccessConfig(channel, "sendAccess", DEFAULT_SEND), community, roles, userId);
}

export function canCreateThreadsInChannel(channel, community, roles, userId) {
  if (!canViewChannel(channel, community, roles, userId)) return false;
  return checkAccess(getAccessConfig(channel, "threadAccess", DEFAULT_THREADS), community, roles, userId);
}

export function canManageChannel(channel, community, roles, userId) {
  if (community.ownerId === userId || community.adminIds.includes(userId)) return true;
  if (hasPermission(community, roles, userId, "manage_channels")) return true;
  return checkAccess(getAccessConfig(channel, "manageAccess", DEFAULT_MANAGE), community, roles, userId);
}

// Validates an access-config object sent from the client before saving it.
export function sanitizeAccessConfig(input) {
  const VALID_TYPES = ["everyone", "roles", "members", "moderators", "administrators", "owner"];
  if (!input || typeof input !== "object" || !VALID_TYPES.includes(input.type)) return null;

  const clean = { type: input.type };
  if (input.type === "roles") clean.roleIds = Array.isArray(input.roleIds) ? input.roleIds : [];
  if (input.type === "members") clean.memberIds = Array.isArray(input.memberIds) ? input.memberIds : [];
  return clean;
}