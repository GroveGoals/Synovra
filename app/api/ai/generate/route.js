import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getTool, buildPrompt } from "@/lib/aiTools";
import { callGemini } from "@/lib/gemini";

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { toolId, values, followUp, history } = await req.json();
  const tool = getTool(toolId);
  if (!tool) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  }

  let contents;

  if (followUp && Array.isArray(history) && history.length > 0) {
    // Continuing a conversation about a result the tool already generated.
    contents = [...history, { role: "user", text: followUp }];
  } else {
    // First run of the tool — validate the form same as before.
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

    contents = [{ role: "user", text: prompt }];
  }

  try {
    const result = await callGemini(contents);
    const updatedHistory = [...contents, { role: "assistant", text: result }];
    return NextResponse.json({ ok: true, result, history: updatedHistory });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}