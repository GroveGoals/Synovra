import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") || "").trim();

  if (username.length < 3) {
    return NextResponse.json({ status: "idle" });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  return NextResponse.json({ status: existing ? "taken" : "available" });
}