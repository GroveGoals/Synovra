"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Star, AlertCircle } from "lucide-react";
import MarkdownText from "@/components/MarkdownText";
import QuizTaker from "@/components/QuizTaker";
import StructuredListView from "@/components/StructuredListView";

function parseStructured(resultText) {
  try {
    const parsed = JSON.parse(resultText);
    if (parsed?.type === "quiz" && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return { kind: "quiz", data: parsed };
    }
    if (["keypoints", "revision", "summary"].includes(parsed?.type) && Array.isArray(parsed.items)) {
      return { kind: "list", data: parsed };
    }
  } catch {
    // Not JSON — markdown-based result (explain, or a tool generated
    // before this structured format existed). Fall through.
  }
  return null;
}

export default function StudyToolResultClient({ runId }) {
  const router = useRouter();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tool-runs/${runId}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Could not load result."); return; }
        setRun(data.run);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [runId]);

  async function toggleFavorite() {
    const next = !run.favorited;
    setRun((r) => ({ ...r, favorited: next }));
    await fetch(`/api/tool-runs/${runId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited: next }),
    });
  }

  if (loading) {
    return <div className="flex justify-center py-16" style={{ color: "var(--text-muted)" }}><Loader2 size={22} className="animate-spin" /></div>;
  }

  const structured = run && !error ? parseStructured(run.result) : null;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[560px] mt-10">
        <button onClick={() => router.push("/tools/school/flashcards")} className="btn-text inline-flex items-center gap-1.5 mb-4">
          <ArrowLeft size={14} /> Smart Tools
        </button>

        {error ? (
          <div className="alert alert-error"><AlertCircle size={15} />{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {run.toolLabel}
              </h1>
              <button onClick={toggleFavorite} aria-label="Favorite" style={{ background: "none", border: "none", color: run.favorited ? "var(--accent)" : "var(--text-muted)" }}>
                <Star size={18} fill={run.favorited ? "var(--accent)" : "none"} />
              </button>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{run.inputSummary}</p>

            {structured?.kind === "quiz" ? (
              <QuizTaker questions={structured.data.questions} coverImage={structured.data.coverImage} />
            ) : structured?.kind === "list" ? (
              <StructuredListView items={structured.data.items} />
            ) : (
              <div className="card p-4" style={{ overflowWrap: "anywhere" }}>
                <MarkdownText text={run.result} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
