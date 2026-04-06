"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClassicsTrack, LessonContent } from "@shared/index";
import { completeLesson } from "@/utils/classicsProgress";

interface LessonPageClientProps {
  track: ClassicsTrack;
  lesson: LessonContent;
  totalLessons: number;
  nextLessonId?: string;
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function LessonPageClient({ track, lesson, totalLessons, nextLessonId }: LessonPageClientProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);

  const checkpointResults = useMemo(() => {
    return lesson.checkpoints.map((checkpoint) => {
      const currentAnswer = normalizeAnswer(answers[checkpoint.id] ?? "");
      const isCorrect = checkpoint.acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === currentAnswer);

      return {
        checkpoint,
        isCorrect,
      };
    });
  }, [answers, lesson.checkpoints]);

  const allCorrect = checkpointResults.length > 0 && checkpointResults.every((result) => result.isCorrect);

  const handleCompleteLesson = () => {
    if (!allCorrect) return;
    completeLesson(track.slug, lesson.id, totalLessons);
    setCompleted(true);
  };

  return (
    <div className="space-y-8">
      <section className="card p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">{track.title}</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">{lesson.title}</h1>
          <p className="max-w-3xl text-lg text-text-secondary">{lesson.overview}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-text-secondary">Lesson length</div>
            <div className="mt-1 text-xl font-semibold text-white">{lesson.estimatedMinutes} min</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-text-secondary">Checkpoint count</div>
            <div className="mt-1 text-xl font-semibold text-white">{lesson.checkpoints.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-text-secondary">Track</div>
            <div className="mt-1 text-xl font-semibold text-white">{track.title}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          {lesson.body.map((paragraph) => (
            <article key={paragraph} className="card p-5 text-base leading-7 text-slate-100">
              {paragraph}
            </article>
          ))}

          <section className="card p-5">
            <h2 className="text-xl font-semibold text-white">Checkpoint</h2>
            <div className="mt-4 space-y-4">
              {checkpointResults.map(({ checkpoint, isCorrect }) => {
                const wasChecked = checked[checkpoint.id];

                return (
                  <div key={checkpoint.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <label className="block text-sm font-semibold text-slate-100" htmlFor={checkpoint.id}>
                      {checkpoint.prompt}
                    </label>
                    <input
                      id={checkpoint.id}
                      type="text"
                      value={answers[checkpoint.id] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({ ...current, [checkpoint.id]: event.target.value }))
                      }
                      className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-slate-100 outline-none transition-colors focus:border-amber-400"
                      placeholder="Type your answer"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setChecked((current) => ({ ...current, [checkpoint.id]: true }))
                        }
                        className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                      >
                        Check answer
                      </button>
                      {wasChecked ? (
                        <span className={`text-sm font-medium ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}>
                          {isCorrect ? "Correct" : "Not yet"}
                        </span>
                      ) : null}
                    </div>
                    {checkpoint.hint ? (
                      <p className="mt-3 text-sm text-text-secondary">Hint: {checkpoint.hint}</p>
                    ) : null}
                    {wasChecked && checkpoint.explanation ? (
                      <p className="mt-2 text-sm text-text-secondary">{checkpoint.explanation}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-text-secondary">
                {allCorrect ? "All checkpoints are correct. You can mark this lesson complete." : "Answer each checkpoint correctly to complete the lesson."}
              </div>
              <button
                type="button"
                disabled={!allCorrect || completed}
                onClick={handleCompleteLesson}
                className="rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
              >
                {completed ? "Lesson completed" : "Complete lesson"}
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white">Key takeaways</h2>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              {lesson.keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white">Next step</h2>
            <div className="mt-4 space-y-3">
              {nextLessonId ? (
                <Link
                  href={`/learn/${track.slug}/${nextLessonId}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Continue to next lesson
                </Link>
              ) : (
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                  You finished the current lesson set for this track.
                </div>
              )}
              <Link
                href={`/learn/${track.slug}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
              >
                Back to track
              </Link>
              <Link
                href="/#quiz-mode"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Jump to quiz mode
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
