import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/email";
import { generateCode, CODE_TTL_MS } from "@/lib/security";

export async function POST(req) {
  const { email } = await req.json();
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!cleanEmail) {
    return NextResponse.json({ error: "Enter your email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (user) {
    const code = generateCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode: code,
        resetExpires: new Date(Date.now() + CODE_TTL_MS),
        lastCodeSentAt: new Date(),
      },
    });
    await sendResetEmail(user.email, code);
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset code has been sent.",
  });
}