import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const { email, code, password } = await req.json();
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (
    !user ||
    !user.resetCode ||
    user.resetCode !== code ||
    !user.resetExpires ||
    new Date(user.resetExpires) < new Date()
  ) {
    return NextResponse.json({ error: "That reset code is invalid or expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetCode: null,
      resetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  return NextResponse.json({ ok: true });
}