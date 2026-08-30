import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

const LANGUAGES = ["English", "French", "Spanish", "Arabic"];
const MAX_BIO_LENGTH = 150;
const MAX_DISPLAY_NAME_LENGTH = 50;

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  return NextResponse.json({
    profile: {
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarDataUrl: user.avatarDataUrl,
      bio: user.bio,
      allowDownloads: user.allowDownloads,
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

  if (typeof body.displayName === "string") {
    const cleanDisplayName = body.displayName.trim();
    if (cleanDisplayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }
    data.displayName = cleanDisplayName || null;
  }

  if (typeof body.bio === "string") {
    const cleanBio = body.bio.trim();
    if (cleanBio.length > MAX_BIO_LENGTH) {
      return NextResponse.json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` }, { status: 400 });
    }
    data.bio = cleanBio || null;
  }

  if (typeof body.allowDownloads === "boolean") {
    data.allowDownloads = body.allowDownloads;
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
      displayName: updated.displayName,
      email: updated.email,
      avatarDataUrl: updated.avatarDataUrl,
      bio: updated.bio,
      allowDownloads: updated.allowDownloads,
      country: updated.country,
      language: updated.language,
      isPublic: updated.isPublic,
      online: updated.online,
    },
  });
}