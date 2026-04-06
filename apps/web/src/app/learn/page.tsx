import type { Metadata } from "next";
import { classicsTracks } from "@/content/classics/tracks";
import { getLessonsForTrack } from "@/content/classics/lessons";
import { LearnHubClient } from "./components/LearnHubClient";

export const metadata: Metadata = {
  title: "Learn Classics | Quivio",
  description: "Study Greek and Roman history, mythology, famous figures, and Latin vocabulary with short guided lessons.",
};

export default function LearnPage() {
  const lessonCounts = Object.fromEntries(
    classicsTracks.map((track) => [track.slug, getLessonsForTrack(track.slug).length]),
  );

  return (
    <main className="min-h-dvh safe-bottom px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">Learn Mode</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Learn the classical world one topic at a time.</h1>
          <p className="mt-4 max-w-3xl text-lg text-text-secondary">
            Choose a track, work through short lessons, and build enough confidence to compete in quiz rooms on the same material.
          </p>
        </section>

        <LearnHubClient tracks={classicsTracks} lessonCounts={lessonCounts} />
      </div>
    </main>
  );
}
