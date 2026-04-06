"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ClassicsTrack } from "@shared/index";
import { readAllTrackProgress } from "@/utils/classicsProgress";

interface LearnHubClientProps {
  tracks: ClassicsTrack[];
  lessonCounts: Record<string, number>;
}

export function LearnHubClient({ tracks, lessonCounts }: LearnHubClientProps) {
  const [progress, setProgress] = useState<Record<string, { completedLessonIds: string[]; masteryScore: number }>>({});

  useEffect(() => {
    setProgress(readAllTrackProgress());
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tracks.map((track) => {
        const trackProgress = progress[track.slug];
        const completed = trackProgress?.completedLessonIds.length ?? 0;
        const totalLessons = lessonCounts[track.slug] ?? 0;
        const mastery = trackProgress?.masteryScore ?? 0;

        return (
          <article key={track.slug} className="card p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Track</p>
              <h2 className="text-2xl font-bold text-white">{track.title}</h2>
              <p className="text-sm text-text-secondary">{track.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {track.subtopics.map((subtopic) => (
                <span
                  key={subtopic}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                >
                  {subtopic}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>{completed} / {totalLessons} lessons completed</span>
                <span>{mastery}% mastery</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${mastery}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Quiz focus: {track.quizTopics[0]}</span>
              <span>{totalLessons} lessons</span>
            </div>

            <Link
              href={`/learn/${track.slug}`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Open track
            </Link>
          </article>
        );
      })}
    </div>
  );
}
