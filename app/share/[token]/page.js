import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MarkdownText from "@/components/MarkdownText";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function SharedChatPage({ params }) {
  const conversation = await prisma.conversation.findUnique({
    where: { shareToken: params.token },
  });
  if (!conversation) notFound();

  const messages = conversation.messages;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[560px] mt-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {conversation.title}
          </h1>
        </div>
        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          Shared from Vreedits — read only
        </p>

        <div className="flex flex-col gap-3 mb-8">
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                background: m.role === "user" ? "var(--accent)" : "var(--surface-2)",
                color: m.role === "user" ? "white" : "var(--text)",
                borderRadius: 14,
                padding: "10px 14px",
                overflowWrap: "anywhere",
              }}
            >
              {m.role === "assistant" ? <MarkdownText text={m.text} /> : <span style={{ fontSize: 14 }}>{m.text}</span>}
            </div>
          ))}
        </div>

        <Link
          href="/register"
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)", color: "white" }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">Made with Syna on Synovra</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Join free and chat with your own AI tools
              </div>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
        </Link>
      </div>
    </div>
  );
}