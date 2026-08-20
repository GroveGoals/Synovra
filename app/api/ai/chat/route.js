import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { SYNA_SYSTEM_CONTEXT } from "@/lib/synaContext";

// Cap attached file size (base64) so one image can't bloat a request or
// the database it eventually gets persisted into via /api/ai/conversations.
const MAX_ATTACHMENT_LENGTH = 5_500_000; // ~4MB actual file

function partsForMessage(m) {
  const parts = [];
  if (m.text) parts.push({ text: m.text });
  if (m.attachment?.dataUrl) {
    const match = m.attachment.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }
  }
  return parts.length > 0 ? parts : [{ text: "" }];
}

export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { messages, clientDateTime } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.attachment?.dataUrl?.length > MAX_ATTACHMENT_LENGTH) {
    return NextResponse.json({ error: "Attachment is too large. Try a smaller file." }, { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it in Render's Environment tab." },
      { status: 500 }
    );
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: partsForMessage(m),
  }));

  /*
   * USER LOCAL DATE/TIME
   *
   * The frontend sends the user's actual device timezone,
   * local date, local time, and weekday.
   *
   * This prevents Syna from relying on Gemini's own date/time
   * knowledge or incorrectly using UTC/PDT/etc.
   */
  let dateTimeContext = "";

  if (
    clientDateTime &&
    typeof clientDateTime === "object" &&
    clientDateTime.timezone &&
    clientDateTime.date &&
    clientDateTime.time &&
    clientDateTime.weekday
  ) {
    dateTimeContext = `
CURRENT USER DATE AND TIME
These values come directly from the user's device/browser.

- User timezone: ${clientDateTime.timezone}
- User local date: ${clientDateTime.date}
- User local time: ${clientDateTime.time}
- User local weekday: ${clientDateTime.weekday}

IMPORTANT DATE/TIME RULES:
- Treat the above user-local date and time as the authoritative current date and time for this conversation.
- When the user asks "what's today's date", use the provided User local date.
- When the user asks "what time is it", use the provided User local time.
- When the user asks "what day is today", use the provided User local weekday.
- When the user asks about tomorrow, yesterday, upcoming days, birthdays, age calculations, timers, or relative dates, calculate them from the provided user-local date.
- Do NOT replace the provided date with Gemini's internal date.
- Do NOT use UTC unless the user specifically asks for UTC.
- Do NOT use a previously remembered date.
- Do NOT guess the user's timezone.
- The user's timezone is ${clientDateTime.timezone}.
`;
  } else {
    /*
     * If an older client does not send clientDateTime,
     * keep Syna functional while making it clear that the
     * client timezone was unavailable.
     */
    dateTimeContext = `
DATE/TIME INFORMATION:
The client did not provide the user's local timezone/date/time.
Do not invent a local timezone or claim a precise local time.
If the user asks for the exact current local time, explain that
the user's local timezone information is currently unavailable.
`;
  }

  const synaContextWithDateTime = `${SYNA_SYSTEM_CONTEXT}

${dateTimeContext}
`;

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
          system_instruction: {
            parts: [{ text: synaContextWithDateTime }],
          },
          contents,
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Gemini error ${res.status}:`, detail);
      const message =
        res.status === 429
          ? "Syna is temporarily unavailable because the AI request limit has been reached. Please try again later."
          : "Syna couldn't respond right now. Please try again in a moment.";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "Syna couldn't respond right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, reply: text });
  } catch (err) {
    console.error("Chat request failed:", err);
    return NextResponse.json(
      { error: "Syna couldn't respond right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}