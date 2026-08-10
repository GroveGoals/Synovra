import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getTool, buildPrompt } from "@/lib/aiTools";
import { callGemini } from "@/lib/gemini";

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { toolId, values } = await req.json();
  const tool = getTool(toolId);
  if (!tool) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  }

  const requiredFields = tool.fields.filter((f) => !f.label.includes("optional"));
  for (const field of requiredFields) {
    if (!values?.[field.name]?.trim()) {
      return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 });
    }
  }

  let prompt;
  try {
    prompt = buildPrompt(tool, values);
  } catch {
    return NextResponse.json({ error: "Could not build request." }, { status: 400 });
  }

  try {
    const result = await callGemini(prompt);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}