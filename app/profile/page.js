"use client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

const LANGUAGES = [
  "English", "Spanish", "French", "Arabic", "Korean", "Chinese",
  "Japanese", "Portuguese", "German", "Hindi", "Russian", "Italian",
];

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  return NextResponse.json({
    profile: {
      username: user.username,
      email: user.email,
      avatarDataUrl: user.avatarDataUrl,
      country: user.country,
      language: user.language,
      isPublic: user.isPublic,
      online: user.online,
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const data = {};

  if (typeof body.username === "string") {
    const cleanUsername = body.username.trim();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (cleanUsername !== user.username) {
      const taken = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (taken) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      data.username = cleanUsername;
    }
  }

  if (typeof body.country === "string") {
    data.country = body.country.trim() || null;
  }

  if (typeof body.language === "string") {
    if (!LANGUAGES.includes(body.language)) {
      return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
    }
    data.language = body.language;
  }

  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic;
  }

  if (typeof body.online === "boolean") {
    data.online = body.online;
    if (body.online) {
      data.lastSeenAt = new Date();
    }
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({
    ok: true,
    profile: {
      username: updated.username,
      email: updated.email,
      avatarDataUrl: updated.avatarDataUrl,
      country: updated.country,
      language: updated.language,
      isPublic: updated.isPublic,
      online: updated.online,
    },
  });
}