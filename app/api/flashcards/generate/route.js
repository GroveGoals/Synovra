import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { fetchRelevantImage } from "@/lib/unsplash";

const MAX_ATTACHMENT_LENGTH = 5_500_000;

function partForImage(att) {
  if (!att?.dataUrl) return null;
  const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { notes, subject, title, images } = await req.json();

  const hasNotes = typeof notes === "string" && notes.trim().length > 0;
  const hasImages = Array.isArray(images) && images.length > 0;

  if (!hasNotes && !hasImages) {
    return NextResponse.json(
      { error: "Add some notes or attach an image first." },
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

  const promptText = `You are generating study flashcards from a student's notes${
    subject ? ` on ${subject}` : ""
  }.
Read the notes and/or attached image(s) below and extract the key concepts
as question-and-answer flashcards.

Rules:
- Return ONLY a JSON array, nothing else. No markdown fences, no commentary.
- Each item must be exactly: {"question": "...", "answer": "..."}
- Questions should be specific and testable, not vague.
- Answers should be concise (1-3 sentences).
- Generate between 5 and 20 cards depending on how much material is present.

Notes:
${hasNotes ? notes : "(see attached image(s) for source material)"}`;

  const parts = [{ text: promptText }];
  for (const img of images || []) {
    const part = partForImage(img);
    if (part) parts.push(part);
  }

  let cards;
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Gemini error ${res.status}:`, detail);
      const message =
        res.status === 429
          ? "The AI request limit has been reached. Please try again later."
          : "Couldn't generate flashcards right now. Please try again in a moment.";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(
        { error: "No flashcards came back. Try adding more detail." },
        { status: 502 }
      );
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    cards = Array.isArray(parsed) ? parsed : parsed.cards;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "Couldn't extract any flashcards from that." },
        { status: 502 }
      );
    }

    cards = cards
      .filter((c) => c?.question && c?.answer)
      .map((c) => ({ front: String(c.question).trim(), back: String(c.answer).trim() }));

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "Couldn't extract any usable flashcards from that." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Flashcard generation failed:", err);
    return NextResponse.json(
      { error: "Couldn't generate flashcards right now. Please try again." },
      { status: 502 }
    );
  }

  // One Unsplash image per card, based on that card's question — only
  // when the note has no images of its own. This means N Unsplash calls
  // for an N-card deck; expect the free-tier hourly limit to bite on
  // heavy use until the app is approved for production.
  let cardsWithImages;
  let coverImageUrl = null;
  let coverImageCreditName = null;
  let coverImageCreditUrl = null;

  if (!hasImages) {
    cardsWithImages = await Promise.all(
      cards.map(async (c) => {
        const photo = await fetchRelevantImage(c.front);
        if (!photo) {
          console.error(`[flashcards] No image found for card: "${c.front}"`);
          return { ...c, imageUrl: null, imageCreditName: null, imageCreditUrl: null };
        }
        return {
          ...c,
          imageUrl: photo.url,
          imageCreditName: photo.photographerName,
          imageCreditUrl: photo.photographerUrl,
        };
      })
    );
    const firstWithImage = cardsWithImages.find((c) => c.imageUrl);
    if (firstWithImage) {
      coverImageUrl = firstWithImage.imageUrl;
      coverImageCreditName = firstWithImage.imageCreditName;
      coverImageCreditUrl = firstWithImage.imageCreditUrl;
    }
  } else {
    cardsWithImages = cards.map((c) => ({ ...c, imageUrl: null, imageCreditName: null, imageCreditUrl: null }));
  }

  const deck = await prisma.flashcardDeck.create({
    data: {
      userId: user.id,
      title: title?.trim() || subject?.trim() || "Untitled Deck",
      subject: subject?.trim() || null,
      sourceText: hasNotes ? notes.trim() : null,
      coverImageUrl,
      coverImageCreditName,
      coverImageCreditUrl,
      cards: {
        create: cardsWithImages.map((c) => ({
          front: c.front,
          back: c.back,
          imageUrl: c.imageUrl,
          imageCreditName: c.imageCreditName,
          imageCreditUrl: c.imageCreditUrl,
        })),
      },
    },
    include: { cards: true },
  });

  return NextResponse.json({ ok: true, deck });
}
