import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { email, code } = await req.json();
  const cleanEmail = (email || "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (
    !user.verificationCode ||
    user.verificationCode !== code ||
    !user.verificationExpires ||
    new Date(user.verificationExpires) < new Date()
  ) {
    return NextResponse.json({ error: "That code is invalid or expired." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      online: true,
      verificationCode: null,
      verificationExpires: null,
    },
  });

  setSessionCookie(signSession(updated.id));

  return NextResponse.json({
    ok: true,
    user: { id: updated.id, username: updated.username, email: updated.email },
  });
}