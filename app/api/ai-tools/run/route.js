// app/api/ai-tools/run/route.js
//
// Generic endpoint every AI tool page posts to. Add a new tool by adding
// one entry to TOOL_CONFIG below — no new route needed.
//
// Requires GEMINI_API_KEY set in your environment (.env.local / host env vars).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const GEMINI_MODEL = "gemini-2.5-flash"; // swap to gemini-2.5-pro if you want higher quality over speed

const TOOL_CONFIG = {
  "recipe-generator": {
    label: "Recipe Generator",
    system:
      "You are a helpful cooking assistant. Given ingredients, dietary notes, or a craving, " +
      "return one clear recipe: a short title, ingredient list with quantities, and numbered steps. " +
      "Keep it practical for a home cook. Plain text only, no markdown headers.",
  },
  "email-writer": {
    label: "Email Writer",
    system:
      "You write clear, professional emails from a short description of what the user wants to say. " +
      "Return only the email body (with a subject line on the first line prefixed 'Subject:'), no extra commentary.",
  },
  "meeting-notes": {
    label: "Meeting Notes",
    system:
      "You turn rough meeting notes or a transcript into a clean summary: key decisions, action items " +
      "(with owner if mentioned), and open questions. Plain text, use simple line breaks, no markdown headers.",
  },
  "homework-helper": {
    label: "Homework Helper",
    system:
      "You are a patient tutor. Given a homework question, walk through the reasoning step by step and " +
      "give the final answer clearly at the end. Don't just give the answer with no explanation.",
  },
};

export async function POST(req) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const toolId = body?.toolId;
  const input = (body?.input || "").trim();

  const config = TOOL_CONFIG[toolId];
  if (!config) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  }
  if (!input) {
    return NextResponse.json({ error: "Please enter something first." }, { status: 400 });
  }

  let resultText;
  try {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: config.system }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input }],
            },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "The AI tool failed to respond. Try again." }, { status: 502 });
    }

    const aiData = await aiRes.json();
    resultText =
      aiData.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  } catch (err) {
    console.error("AI tool run error:", err);
    return NextResponse.json({ error: "Network error contacting the AI service." }, { status: 502 });
  }

  const run = await prisma.toolRun.create({
    data: {
      userId,
      toolId,
      toolLabel: config.label,
      inputSummary: input.slice(0, 200),
      result: resultText,
    },
  });

  return NextResponse.json({ run });
}