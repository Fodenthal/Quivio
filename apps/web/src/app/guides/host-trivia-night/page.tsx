import React from "react";
import Link from "next/link";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "How to Host a Trivia Night | Quivio Guide",
  description: "Step-by-step guide with a printable checklist to set up, run, and wrap a trivia session using Quivio.",
};

export default function HostTriviaNightGuide() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Guide</p>
        <h1 className="text-3xl font-bold text-white">How to host a great trivia night</h1>
        <p className="text-gray-400">
          A practical, step-by-step guide with a printable checklist to set up, run, and wrap a trivia session using Quivio.
        </p>
        <Link
          href="/host-trivia-checklist"
          className="inline-block text-sm text-blue-300 underline decoration-blue-400"
          prefetch={false}
        >
          Download the checklist
        </Link>
      </header>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Before the event</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Pick 4–6 topics that fit your audience (mix easy and challenging).</li>
          <li>Create a public room for quick join, or private if you want a controlled list.</li>
          <li>Share the PIN and a start time; recommend everyone tests audio/chat.</li>
          <li>Prepare 1–2 icebreaker questions to warm up the room.</li>
        </ul>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">During the game</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Set expectations: how many rounds, time per question, and scoring.</li>
          <li>Keep pacing tight: short pauses between questions; quick recaps after each round.</li>
          <li>Highlight close scores to keep players engaged; celebrate great answers.</li>
          <li>Moderate chat: keep it friendly, and move past disputes quickly.</li>
        </ul>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">After the game</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Share the final leaderboard and give shoutouts for best answers.</li>
          <li>Ask for feedback: topics people loved, pacing, and difficulty.</li>
          <li>Save strong questions into a reusable set for future sessions.</li>
          <li>Rotate topics each week to avoid repeats and keep it fresh.</li>
        </ul>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Downloadable checklist</h2>
        <p className="text-gray-300">
          Grab the printable checklist to keep beside you while you host. It covers setup, pacing reminders, and closing steps.
        </p>
        <Link
          href="/host-trivia-checklist"
          className="inline-block text-sm text-blue-300 underline decoration-blue-400"
          prefetch={false}
        >
          Download checklist (TXT)
        </Link>
      </section>
    </main>
  );
}
