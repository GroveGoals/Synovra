import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// Called via navigator.sendBeacon when the tab closes/hides, so this needs
// to work as a simple POST with no body required.
export async function POST() {
  const userId = getSessionUserId();
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { online: false } }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}