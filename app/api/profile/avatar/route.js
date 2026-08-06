import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

// Cap the stored image size so one avatar can't bloat the database —
// 1.5MB base64 (~1.1MB actual image), plenty for a profile picture once
// the client has resized/compressed it before sending.
const MAX_DATA_URL_LENGTH = 1_500_000;

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { dataUrl } = await req.json();
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image." }, { status: 400 });
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "Image is too large. Try a smaller photo." }, { status: 413 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarDataUrl: dataUrl },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { avatarDataUrl: null } });
  return NextResponse.json({ ok: true });
}
