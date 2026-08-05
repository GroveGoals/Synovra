import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const userId = getSessionUserId();
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { online: false } }).catch(() => {});
  }
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}