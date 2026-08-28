import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "vreedits_session";
const SESSION_DAYS = 30;

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Add it in Render's Environment tab."
    );
  }
  return secret;
}

export function signSession(userId) {
  return jwt.sign({ userId }, requireSecret(), { expiresIn: `${SESSION_DAYS}d` });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, requireSecret());
  } catch {
    return null;
  }
}

export function setSessionCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function getSessionUserId() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload?.userId ?? null;
}