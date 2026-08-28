import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { fetchRelevantImage } from "@/lib/unsplash";

const MAX_ATTACHMENT_LENGTH = 5_500_000;

const TOOL_CONFIG = {
  quiz: {
    label: "Practice Quiz",
    instructions: `Create a practice quiz from the notes below.
Include 8-12 questions mixing multiple choice and short answer.
For multiple choice, list 4 options and mark the correct one.
Format as clean markdown with numbered questions and an "Answer Key" section at the end.`,
  },
  summary: {
    label: "Summary",
    instructions: `Write a clear, well-organized summary of the notes below.
Use short paragraphs and headings for major sections. Keep it concise but complete.`,
  },
  keypoints: {
    label: "Key-Point List",
    instructions: `Extract the key points from the notes below as a bulleted list.
Group related points under short headings where it makes sense. Keep each point to one line.`,
  },
  revision: {
    label: "Revision Questions",
    instructions: `Write 10-15 open-ended revision questions based on the notes below,
designed to test real understanding rather than simple recall.
Format as a numbered markdown list. Do not include answers.`,
  },
  explain: {
    label: "Explanation",
    instructions: `Explain the material in the notes below clearly and step by step.
If there are attached images, go through them one at a time in the order given —
use a heading like "Image 1", "Image 2", etc. for each one, and explain what it
shows and how it connects to the notes. After covering all images (if any),
give a short overall explanation of the text content as a final section.
If there are no images, just explain the text content step by step.
Format as markdown.`,
  },
};

function partForImage(att) {
  if (!att?.dataUrl) return null;
  const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { toolType, notes, subject, title, images } = await req.json();

  const config = TOOL_CONFIG[toolType];
  if (!config) {
    return NextResponse.json({ error: "Unknown study tool type." }, { status: 400 });
  }

  const hasNotes = typeof notes === "string" && notes.trim().length > 0;
  const hasImages = Array.isArray(images) && images.length > 0;

  if (!hasNotes && !hasImages) {
    return NextResponse.json(
      { error: "This note doesn't have any text or images to work from yet." },
      { status: 400 }
    );
  }

  for (const img of images || []) {
    if (img?.dataUrl?.length > MAX_ATTACHMENT_LENGTH) {
      return NextResponse.json(
        { error: "One of your images is too large. Try a smaller file." },
        { status: 413 }
      );
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it in Render's Environment tab." },
      { status: 500 }
    );
  }

  const promptText = `${config.instructions}${subject ? `\n\nSubject: ${subject}` : ""}

Notes:
${hasNotes ? notes : "(see attached image(s) for source material)"}`;

  const parts = [{ text: promptText }];
  for (const img of images || []) {
    const part = partForImage(img);
    if (part) parts.push(part);
  }

  let resultText;
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({ contents: [{ role: "user", parts }] }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Gemini error ${res.status}:`, detail);
      const message =
        res.status === 429
          ? "The AI request limit has been reached. Please try again later."
          : "Couldn't generate that right now. Please try again in a moment.";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      return NextResponse.json(
        { error: "Nothing came back. Try adding more detail to the note." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Study tool generation failed:", err);
    return NextResponse.json(
      { error: "Couldn't generate that right now. Please try again." },
      { status: 502 }
    );
  }

  // "Explain this" with no images of its own: try to pull in one relevant
  // stock photo from Unsplash so the explanation isn't purely text.
  if (toolType === "explain" && !hasImages) {
    const query = subject?.trim() || title?.trim() || notes?.trim().slice(0, 60);
    const photo = await fetchRelevantImage(query);
    if (photo) {
      const attribution = `*Photo by [${photo.photographerName}](${photo.photographerUrl}?utm_source=vreedits&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=vreedits&utm_medium=referral)*`;
      resultText = `



![${query}](${photo.url})



\n${attribution}\n\n${resultText}`;
    }
  }

  const run = await prisma.toolRun.create({
    data: {
      userId: user.id,
      toolId: `study-${toolType}`,
      toolLabel: config.label,
      inputSummary: title?.trim() || subject?.trim() || "Untitled note",
      result: resultText,
    },
  });

  return NextResponse.json({ ok: true, run });
}