import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Render's free Postgres occasionally drops idle connections
  // (Prisma logs "Error in PostgreSQL connection: Error { kind: Closed }").
  // One retry covers that case instead of surfacing it as a user-facing error.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const runs = await prisma.toolRun.findMany({
        where: { userId: user.id, toolId: { startsWith: "study-" } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ ok: true, runs });
    } catch (err) {
      console.error(`[study-tools] Load attempt ${attempt + 1} failed:`, err);
      if (attempt === 1) {
        return NextResponse.json({ error: "Could not load recent study materials." }, { status: 500 });
      }
    }
  }
}

