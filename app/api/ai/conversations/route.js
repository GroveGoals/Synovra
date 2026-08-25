import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { callGemini } from "@/lib/gemini";

async function generateTitle(messages) {
  const firstUserMsg = messages.find((m) => m.role === "user")?.text || "";
  if (!firstUserMsg.trim()) return "New chat";

  try {
    const result = await callGemini(
      `Give a short, clean chat title (max 5 words, no quotes, no punctuation at the end) summarizing what this message is about: "${firstUserMsg.slice(0, 300)}"`
    );
    const clean = result.trim().replace(/^["']|["']$/g, "").split("\n")[0];
    return clean.length > 60 ? clean.slice(0, 60) : clean || firstUserMsg.slice(0, 40);
  } catch {
    const trimmed = firstUserMsg.trim();
    return trimmed.length > 40 ? trimmed.slice(0, 40) + "…" : trimmed;
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, updatedAt: true, pinned: true, shareToken: true },
  });

  return NextResponse.json({ conversations });
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const title = await generateTitle(messages);

  const conversation = await prisma.conversation.create({
    data: { userId: user.id, title, messages },
  });

  return NextResponse.json({ ok: true, conversation });
}