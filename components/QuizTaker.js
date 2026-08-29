"use client";
import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizTaker({ questions, coverImage }) {
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  function selectAnswer(qIndex, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)));
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  function handleRetake() {
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const correctCount = submitted
    ? answers.filter((a, i) => a === questions[i].correctIndex).length
    : 0;
  const incorrectCount = submitted ? questions.length - correctCount : 0;

  return (
    <div>
      {coverImage && (
        <div className="mb-4">
          <img src={coverImage.url} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          {coverImage.creditName && (
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Photo by{" "}
              <a href={`${coverImage.creditUrl}?utm_source=vreedits&utm_medium=referral`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                {coverImage.creditName}
              </a>{" "}
              on{" "}
              <a href="https://unsplash.com/?utm_source=vreedits&utm_medium=referral" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                Unsplash
              </a>
            </div>
          )}
        </div>
      )}

      {submitted && (
        <div className="card p-4 mb-4" style={{ textAlign: "center" }}>
          <div className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {correctCount} / {questions.length}
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--success, #4ade80)" }}>{correctCount} passed</span>
            {" · "}
            <span style={{ color: "var(--danger, #e55)" }}>{incorrectCount} failed</span>
          </div>
          <button onClick={handleRetake} className="btn-primary mt-3" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            <RotateCcw size={13} /> Retake
          </button>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const selected = answers[qIndex];
          const isCorrectAnswer = (optIndex) => submitted && optIndex === q.correctIndex;
          const isWrongSelected = (optIndex) => submitted && selected === optIndex && optIndex !== q.correctIndex;

          return (
            <div key={qIndex} className="card p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-sm font-semibold" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  {qIndex + 1}.
                </span>
                <span className="text-sm font-medium" style={{ flex: 1 }}>{q.question}</span>
                {submitted && (
                  selected === q.correctIndex
                    ? <Check size={15} style={{ color: "var(--success, #4ade80)", flexShrink: 0 }} />
                    : <X size={15} style={{ color: "var(--danger, #e55)", flexShrink: 0 }} />
                )}
              </div>
              <div className="space-y-1.5 pl-5">
                {q.options.map((opt, optIndex) => {
                  let style = { background: "var(--surface-2)", color: "var(--text)" };
                  if (isCorrectAnswer(optIndex)) {
                    style = { background: "rgba(74, 222, 128, 0.15)", color: "var(--success, #4ade80)", fontWeight: 600 };
                  } else if (isWrongSelected(optIndex)) {
                    style = { background: "rgba(229, 85, 85, 0.15)", color: "var(--danger, #e55)", fontWeight: 600 };
                  } else if (!submitted && selected === optIndex) {
                    style = { background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 };
                  }
                  return (
                    <button
                      key={optIndex}
                      onClick={() => selectAnswer(qIndex, optIndex)}
                      disabled={submitted}
                      className="flex items-center gap-2 w-full p-2 rounded-lg text-sm"
                      style={{ textAlign: "left", border: "none", ...style }}
                    >
                      <span style={{ fontWeight: 700, opacity: 0.7, flexShrink: 0 }}>{LETTERS[optIndex]})</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={answeredCount < questions.length}
          className="btn-primary mt-4 w-full"
          style={{ opacity: answeredCount < questions.length ? 0.5 : 1 }}
        >
          {answeredCount < questions.length
            ? `Answer all questions (${answeredCount}/${questions.length})`
            : "Submit Quiz"}
        </button>
      )}
    </div>
  );
}
