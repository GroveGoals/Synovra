import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { fetchRelevantImage } from "@/lib/unsplash";

const MAX_ATTACHMENT_LENGTH = 5_500_000;

const MARKDOWN_TOOL_CONFIG = {
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

const QUIZ_LABEL = "Practice Quiz";

function partForImage(att) {
  if (!att?.dataUrl) return null;
  const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

function sanitizeAltText(raw) {
  if (!raw) return "Related image";
  const cleaned = raw
    .replace(/[\r\n]+/g, " ")
    .replace(/[\[\]()]/g, "")
    .trim()
    .slice(0, 60);
  return cleaned || "Related image";
}

async function callGeminiText(parts) {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts }] }),
    }
  );
  return res;
}

async function callGeminiJson(parts) {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  return res;
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { toolType, notes, subject, title, images } = await req.json();

  const isQuiz = toolType === "quiz";
  const markdownConfig = MARKDOWN_TOOL_CONFIG[toolType];
  if (!isQuiz && !markdownConfig) {
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

  const noteBody = hasNotes ? notes : "(see attached image(s) for source material)";

  // Fetch a fallback cover image up front — used by both the quiz JSON
  // payload and the markdown-prepend path below.
  let coverImage = null;
  if (!hasImages) {
    const searchQuery = subject?.trim() || title?.trim() || notes?.trim().slice(0, 60);
    const photo = await fetchRelevantImage(searchQuery);
    if (photo) {
      coverImage = {
        url: photo.url,
        creditName: photo.photographerName,
        creditUrl: photo.photographerUrl,
      };
    } else {
      console.error(`[study-tools] No fallback image found for query: "${searchQuery}"`);
    }
  }

  let storedResult;
  let toolLabel;

  if (isQuiz) {
    toolLabel = QUIZ_LABEL;
    const promptText = `Create a multiple-choice practice quiz from the notes below${
      subject ? ` on ${subject}` : ""
    }.

Rules:
- Return ONLY a JSON object, nothing else. No markdown fences, no commentary.
- Shape: {"questions": [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0}]}
- Exactly 4 options per question. correctIndex is the 0-based index of the right option.
- Generate 8-12 questions covering the material well.
- Questions should be specific and testable, not vague.

Notes:
${noteBody}`;

    const parts = [{ text: promptText }];
    for (const img of images || []) {
      const part = partForImage(img);
      if (part) parts.push(part);
    }

    try {
      const res = await callGeminiJson(parts);
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`Gemini error ${res.status}:`, detail);
        const message =
          res.status === 429
            ? "The AI request limit has been reached. Please try again later."
            : "Couldn't generate the quiz right now. Please try again in a moment.";
        return NextResponse.json({ error: message }, { status: res.status });
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return NextResponse.json(
          { error: "No quiz came back. Try adding more detail to the note." },
          { status: 502 }
        );
      }

      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      let questions = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: "Couldn't build a quiz from that." },
          { status: 502 }
        );
      }

      questions = questions
        .filter((q) => q?.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number")
        .map((q) => ({
          question: String(q.question).trim(),
          options: q.options.map((o) => String(o).trim()),
          correctIndex: q.correctIndex,
        }));

      if (questions.length === 0) {
        return NextResponse.json(
          { error: "Couldn't build usable quiz questions from that." },
          { status: 502 }
        );
      }

      storedResult = JSON.stringify({ type: "quiz", questions, coverImage });
    } catch (err) {
      console.error("Quiz generation failed:", err);
      return NextResponse.json(
        { error: "Couldn't generate the quiz right now. Please try again." },
        { status: 502 }
      );
    }
  } else {
    toolLabel = markdownConfig.label;
    const promptText = `${markdownConfig.instructions}${subject ? `\n\nSubject: ${subject}` : ""}

Notes:
${noteBody}`;

    const parts = [{ text: promptText }];
    for (const img of images || []) {
      const part = partForImage(img);
      if (part) parts.push(part);
    }

    try {
      const res = await callGeminiText(parts);
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
      let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        return NextResponse.json(
          { error: "Nothing came back. Try adding more detail to the note." },
          { status: 502 }
        );
      }

      if (coverImage) {
        const altText = sanitizeAltText(subject?.trim() || title?.trim());
        const attribution = `*Photo by [${coverImage.creditName}](${coverImage.creditUrl}?utm_source=vreedits&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=vreedits&utm_medium=referral)*`;
        resultText = `![${altText}](${coverImage.url})\n${attribution}\n\n${resultText}`;
      }

      storedResult = resultText;
    } catch (err) {
      console.error("Study tool generation failed:", err);
      return NextResponse.json(
        { error: "Couldn't generate that right now. Please try again." },
        { status: 502 }
      );
    }
  }

  const run = await prisma.toolRun.create({
    data: {
      userId: user.id,
      toolId: `study-${toolType}`,
      toolLabel,
      inputSummary: title?.trim() || subject?.trim() || "Untitled note",
      result: storedResult,
    },
  });

  return NextResponse.json({ ok: true, run });
}
