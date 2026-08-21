import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateCode, CODE_TTL_MS } from "@/lib/security";

export async function POST(req) {
  const { username, email, password } = await req.json();

  if (!username?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: cleanEmail } }),
    prisma.user.findUnique({ where: { username: cleanUsername } }),
  ]);
  if (emailTaken) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  if (usernameTaken) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const code = generateCode();

  const user = await prisma.user.create({
    data: {
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      verificationCode: code,
      verificationExpires: new Date(Date.now() + CODE_TTL_MS),
      lastCodeSentAt: new Date(),
    },
  });

  try {
    await sendVerificationEmail(user.email, code);
  } catch (err) {
    return NextResponse.json(
      { ok: true, email: user.email, emailError: err.message },
      { status: 201 }
    );
  }

  return NextResponse.json({ ok: true, email: user.email }, { status: 201 });
}