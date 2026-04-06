"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ClassicsTrack, LessonContent, VocabularyDeck } from "@shared/index";
import { getTrackProgress } from "@/utils/classicsProgress";

interface TrackDetailClientProps {
  track: ClassicsTrack;
  lessons: LessonContent[];
  vocabularyDeck?: VocabularyDeck;
}

export function TrackDetailClient({ track, lessons, vocabularyDeck }: TrackDetailClientProps) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [masteryScore, setMasteryScore] = useState(0);

  useEffect(() => {
    const progress = getTrackProgress(track.slug);
    setCompletedLessonIds(progress.completedLessonIds);
    setMasteryScore(progress.masteryScore);
  }, [track.slug]);

  return (
    <div className="space-y-8">
      <section className="card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">Learn Mode</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">{track.title}</h1>
            <p className="max-w-3xl text-lg text-text-secondary">{track.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <div>{completedLessonIds.length} / {lessons.length} lessons completed</div>
            <div className="mt-1 font-semibold text-amber-200">{masteryScore}% mastery</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);

            return (
              <article key={lesson.id} className="card p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lesson {lesson.order}</p>
                    <h2 className="text-2xl font-semibold text-white">{lesson.title}</h2>
                    <p className="text-sm text-text-secondary">{lesson.description}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isCompleted ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                    {isCompleted ? "Completed" : `${lesson.estimatedMinutes} min`}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lesson.keyTakeaways.map((point) => (
                    <span key={point} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {point}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/learn/${track.slug}/${lesson.id}`}
                  className="mt-5 inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  {isCompleted ? "Review lesson" : "Start lesson"}
                </Link>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-white">Subtopics</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {track.subtopics.map((subtopic) => (
                <span key={subtopic} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  {subtopic}
                </span>
              ))}
            </div>
          </div>

          {vocabularyDeck ? (
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-white">{vocabularyDeck.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{vocabularyDeck.description}</p>
              <div className="mt-4 space-y-2">
                {vocabularyDeck.entries.slice(0, 4).map((entry) => (
                  <div key={entry.term} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="font-semibold text-slate-100">{entry.term}</div>
                    <div className="text-sm text-text-secondary">{entry.translation}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-white">Use it in Quiz Mode</h3>
            <p className="mt-2 text-sm text-text-secondary">
              When you are ready, go back to the homepage and create a room focused on {track.quizTopics[0]}.
            </p>
            <Link
              href="/#quiz-mode"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Back to quiz mode
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
