export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function isLockedOut(user) {
  return Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());
}
