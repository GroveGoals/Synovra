import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateCode, CODE_TTL_MS } from "@/lib/security";

function isValidUsername(username) {
  return /^[a-z][a-z0-9_]{2,29}$/.test(username);
}

function isValidDisplayName(displayName) {
  return /^[\p{L}\p{N}][\p{L}\p{N} ._'’-]{0,49}$/u.test(displayName);
}

function parseDateOfBirth(value) {
  if (!value || typeof value !== "string") return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);

  let age = today.getUTCFullYear() - birth.getUTCFullYear();

  const birthdayNotReached =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() &&
      today.getUTCDate() < birth.getUTCDate());

  if (birthdayNotReached) {
    age--;
  }

  return age;
}

export async function POST(req) {
  try {
    const {
      username,
      displayName,
      email,
      password,
      dateOfBirth,
    } = await req.json();

    if (
      !username?.trim() ||
      !displayName?.trim() ||
      !email?.trim() ||
      !password ||
      !dateOfBirth
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanDisplayName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidUsername(cleanUsername)) {
      return NextResponse.json(
        {
          error:
            "Username must start with a lowercase letter and contain only lowercase letters, numbers, or underscores. It must be 3–30 characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidDisplayName(cleanDisplayName)) {
      return NextResponse.json(
        {
          error:
            "Display name must be 1–50 characters and may contain letters, numbers, spaces, periods, apostrophes, and hyphens.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const dob = parseDateOfBirth(dateOfBirth);

    if (!dob) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth." },
        { status: 400 }
      );
    }

    const age = calculateAge(dob);

    if (age < 13) {
      return NextResponse.json(
        {
          error:
            "You must meet Synovra's minimum age requirement to create an account.",
        },
        { status: 400 }
      );
    }

    if (age > 120) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth." },
        { status: 400 }
      );
    }

    const [emailTaken, usernameTaken] = await Promise.all([
      prisma.user.findUnique({
        where: { email: cleanEmail },
      }),
      prisma.user.findUnique({
        where: { username: cleanUsername },
      }),
    ]);

    if (emailTaken) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    if (usernameTaken) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const code = generateCode();

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        displayName: cleanDisplayName,
        email: cleanEmail,
        dateOfBirth: dob,

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
        {
          ok: true,
          email: user.email,
          emailError:
            err instanceof Error ? err.message : "Email failed",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating your account." },
      { status: 500 }
    );
  }
}